import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { isSameDay, parseISO } from "date-fns";
import { getPriorityColor } from "@/utils/taskColors";

interface TimeSlot {
  hour: number;
  display: string;
}

interface WeeklyTimeGridProps {
  timeSlots: TimeSlot[];
  weekDays: Date[];
  showFullWeek: boolean;
  tasks: Task[];
}

export function WeeklyTimeGrid({ timeSlots, weekDays, showFullWeek, tasks }: WeeklyTimeGridProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="divide-y divide-gray-300">
        {timeSlots.map((time, timeIndex) => (
          <div 
            key={timeIndex} 
            className={cn(
              "grid",
              showFullWeek ? "grid-cols-8" : "grid-cols-6",
              "min-h-[80px]"
            )}
          >
            {/* Time column - Made narrower */}
            <div className={cn(
              "p-1 border-r border-gray-300 relative",
              "bg-[#B2E3EA]", // Light teal background
              "transition-colors",
              "w-[40px]" // Explicitly set narrow width
            )}>
              <div className="text-xs text-[#6B7280] whitespace-pre-line text-center">
                {time.hour}
              </div>
            </div>
            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayTasks = tasks.filter(task => {
                if (!task.date || !task.start_time) return false;
                const taskDate = parseISO(task.date);
                const taskHour = parseInt(task.start_time.split(':')[0]);
                return isSameDay(taskDate, day) && taskHour === time.hour;
              });

              return (
                <div 
                  key={dayIndex}
                  className={cn(
                    "pl-0.5 pr-1 py-1", // Reduced left padding significantly
                    "relative",
                    "transition-colors",
                    timeIndex % 2 === 0 ? "bg-[#F8F8FC]" : "bg-white",
                    "border-r border-gray-300 last:border-r-0",
                    "hover:bg-gray-50/50"
                  )}
                >
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "px-1 py-1 rounded-md mb-0.5", // Reduced horizontal padding
                        "text-[11px] leading-tight",
                        "text-white break-words",
                        "h-full",
                        getPriorityColor(task.priority)
                      )}
                    >
                      <div className="font-medium line-clamp-3">{task.title}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}