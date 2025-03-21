
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarDay } from "./calendar/CalendarDay";
import { startOfMonth, eachDayOfInterval, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CalendarProps {
  initialDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export function Calendar({ initialDate, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate || new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Fetch tasks from Supabase
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsEditDrawerOpen(true);
  };

  // Get all dates for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Generate array of dates for the calendar
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <Card className="w-full h-full mx-auto shadow-sm">
      <CardHeader className="pb-0">
        <CalendarHeader 
          monthYear={monthYear}
          onNextMonth={nextMonth}
          onPreviousMonth={previousMonth}
        />
      </CardHeader>
      
      <CardContent className="pt-6 h-[calc(100%-80px)]">
        <div className="border rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl h-full">
          <div className="grid grid-cols-7 gap-px bg-gradient-to-r from-[#2A9BB5] to-[#1C7A8C] text-white">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="p-3 text-sm font-medium text-center">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-200 h-[calc(100%-48px)] overflow-auto">
            {calendarDays.map((date, i) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isToday = new Date().toDateString() === date.toDateString();
              
              const dayTasks = tasks.filter(task => {
                if (!task.date || task.status !== 'scheduled') return false;
                const taskDate = parseISO(task.date);
                return taskDate.toDateString() === date.toDateString();
              });

              return (
                <CalendarDay
                  key={i}
                  date={date}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  tasks={dayTasks}
                  onTaskClick={handleTaskClick}
                  onDateClick={onDateSelect}
                />
              );
            })}
          </div>
        </div>
      </CardContent>

      {selectedTask && (
        <EditTaskDrawer
          task={selectedTask}
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
        />
      )}
    </Card>
  );
}
