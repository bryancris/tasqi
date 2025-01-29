import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeeklyDayHeader } from "./calendar/WeeklyDayHeader";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const currentDate = initialDate || new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start on Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  
  // Get all days in the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate time slots from 8:00 to 17:00 (5 PM)
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  // Fetch all tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
  });

  // Split tasks into scheduled and unscheduled
  const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
  const unscheduledTasks = tasks.filter(task => task.status === 'unscheduled');

  // Calculate visits per day
  const visitsPerDay = weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => 
      task.date && isSameDay(parseISO(task.date), day)
    );
    return `${dayTasks.length} ${dayTasks.length === 1 ? 'Visit' : 'Visits'}`;
  });

  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <div className="flex gap-4 w-full max-w-[95%] mx-auto">
      {/* Main Calendar Section */}
      <div className="flex-1">
        <CalendarHeader 
          monthYear={monthYear}
          onNextMonth={() => {}}
          onPreviousMonth={() => {}}
          showWeekly={true}
        />

        <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
          <WeeklyDayHeader weekDays={weekDays} visitsPerDay={visitsPerDay} />
          <WeeklyCalendarGrid 
            weekDays={weekDays}
            timeSlots={timeSlots}
            scheduledTasks={scheduledTasks}
          />
        </div>
      </div>

      {/* Unscheduled Tasks Section */}
      <UnscheduledTasks tasks={unscheduledTasks} />
    </div>
  );
}