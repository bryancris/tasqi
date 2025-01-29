import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { cn } from "@/lib/utils";
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

  // Fetch tasks from Supabase
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'scheduled')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data as Task[];
    },
  });

  // Calculate visits per day
  const visitsPerDay = weekDays.map(day => {
    const dayTasks = tasks.filter(task => 
      task.date && isSameDay(parseISO(task.date), day)
    );
    return `${dayTasks.length} ${dayTasks.length === 1 ? 'Visit' : 'Visits'}`;
  });

  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <div className="w-full max-w-[95%] mx-auto">
      <CalendarHeader 
        monthYear={monthYear}
        onNextMonth={() => {}}
        onPreviousMonth={() => {}}
        showWeekly={true}
      />

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b">
          {/* Empty cell for time column */}
          <div className="p-4 border-r bg-gray-50"></div>
          
          {weekDays.map((day, index) => (
            <div 
              key={index}
              className="p-4 text-center border-r last:border-r-0 bg-gray-50"
            >
              <div className="font-semibold uppercase text-sm text-gray-600">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-medium">
                {format(day, 'd')}
              </div>
              <div className="text-xs text-gray-500">
                {visitsPerDay[index]}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots grid */}
        <div className="divide-y">
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="grid grid-cols-8">
              {/* Time column */}
              <div className="p-4 border-r text-sm font-medium text-gray-500">
                {time}
              </div>
              
              {/* Day columns */}
              {weekDays.map((day, dayIndex) => (
                <div 
                  key={dayIndex}
                  className={cn(
                    "p-2 border-r last:border-r-0 min-h-[80px] relative",
                    "hover:bg-gray-50 transition-colors"
                  )}
                >
                  {tasks
                    .filter(task => 
                      task.date && 
                      isSameDay(parseISO(task.date), day) && 
                      task.start_time && 
                      task.start_time.startsWith(time.split(':')[0])
                    )
                    .map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={cn(
                          "p-2 rounded-md mb-1 text-sm",
                          task.priority === 'high' && "bg-red-100 border border-red-200",
                          task.priority === 'medium' && "bg-yellow-100 border border-yellow-200",
                          task.priority === 'low' && "bg-green-100 border border-green-200",
                          !task.priority && "bg-blue-100 border border-blue-200"
                        )}
                      >
                        <div className="font-medium">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}