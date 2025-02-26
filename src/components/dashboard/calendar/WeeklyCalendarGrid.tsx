
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { TimeColumn } from "./TimeColumn";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";

interface WeeklyCalendarGridProps {
  currentDate: Date;
  showFullWeek: boolean;
  className?: string;
}

export function WeeklyCalendarGrid({ 
  currentDate,
  showFullWeek,
  className 
}: WeeklyCalendarGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4);
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      display: `${hour}:00`
    };
  });

  const { tasks } = useTasks();
  const scheduledTasks = tasks.filter(task => task.date && task.start_time);

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <div className="relative flex h-full overflow-x-auto overflow-y-auto scrollbar-hide">
        <TimeColumn timeSlots={timeSlots} />
        <div className="flex flex-1 overflow-x-auto scrollbar-hide">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 min-w-[120px] relative border-r last:border-r-0 bg-white"
            >
              <div className="sticky top-0 z-10 bg-white border-b px-2 py-1 text-sm font-medium">
                {format(day, 'EEE d')}
              </div>
              {timeSlots.map((slot, idx) => (
                <div
                  key={`${day.toISOString()}-${slot.hour}`}
                  className={cn(
                    "relative border-t h-[60px] -mt-[1px] first:mt-0",
                    idx === timeSlots.length - 1 && "border-b"
                  )}
                >
                  {scheduledTasks
                    .filter(
                      (task) =>
                        task.date &&
                        format(new Date(task.date), "yyyy-MM-dd") ===
                          format(day, "yyyy-MM-dd") &&
                        task.start_time &&
                        parseInt(task.start_time.split(':')[0]) === slot.hour
                    )
                    .map((task) => (
                      <div
                        key={task.id}
                        className="absolute left-0 right-0 top-0 p-1"
                      >
                        <div 
                          className={cn(
                            "text-xs p-1.5 rounded border",
                            "bg-blue-100 border-blue-200",
                            "hover:bg-blue-200 transition-colors",
                            "cursor-pointer truncate"
                          )}
                        >
                          {task.title}
                        </div>
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
