import { format, isSameDay, parseISO } from "date-fns";
import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: string[];
  scheduledTasks: Task[];
}

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks }: WeeklyCalendarGridProps) {
  const getTaskColor = (task: Task) => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-100 border-red-200 text-red-900';
      case 'medium':
        return 'bg-green-100 border-green-200 text-green-900';
      case 'low':
        return 'bg-blue-100 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

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
                      "p-2 rounded-md mb-1 text-sm border",
                      getTaskColor(task)
                    )}
                  >
                    <div className="font-medium">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-xs opacity-75 mt-1">
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