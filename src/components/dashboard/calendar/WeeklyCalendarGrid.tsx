import { format, isSameDay, parseISO } from "date-fns";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: string[];
  scheduledTasks: Task[];
}

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks }: WeeklyCalendarGridProps) {
  return (
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
              {scheduledTasks
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
  );
}