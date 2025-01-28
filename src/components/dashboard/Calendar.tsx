import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { CalendarDay } from "./calendar/CalendarDay";

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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
        .eq('status', 'scheduled');
      
      if (error) throw error;
      return data as Task[];
    },
  });

  return (
    <div className="w-full max-w-7xl mx-auto">
      <CalendarHeader 
        monthYear={monthYear}
        onNextMonth={nextMonth}
        onPreviousMonth={previousMonth}
      />

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="bg-white p-2 text-sm font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {Array.from({ length: 42 }, (_, i) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - currentMonth.getDay() + 2);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = new Date().toDateString() === date.toDateString();
            
            // Filter tasks for this day
            const dayTasks = tasks.filter(task => {
              if (!task.date) return false;
              const taskDate = new Date(task.date);
              return taskDate.toDateString() === date.toDateString();
            });

            return (
              <CalendarDay
                key={i}
                date={date}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                tasks={dayTasks}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}