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
            {/* Time column */}
            <div className={cn(
              "p-2 border-r border-gray-300 relative",
              "bg-[#B2E3EA]", // Light teal background for time slots
              "transition-colors"
            )}>
              <div className="text-xs text-[#6B7280] whitespace-pre-line">
                {time.display}
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
                    "p-2 relative",
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
                        "p-2 rounded-md mb-1 text-sm text-white",
                        getPriorityColor(task.priority)
                      )}
                    >
                      <div className="font-medium">{task.title}</div>
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