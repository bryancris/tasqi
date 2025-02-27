
import { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Task } from "../TaskBoard";
import { WeeklyTaskCard } from "../task-card/WeeklyTaskCard";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";

export function MobileWeeklyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const { tasks } = useTasks();

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

  const scheduledTasks = tasks?.filter(task => task.date && task.start_time) || [];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Calendar Controls - Now with white background */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <h2 className="text-base font-semibold text-gray-700 truncate">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFullWeek(!showFullWeek)}
            className="h-8 text-xs px-2"
          >
            {showFullWeek ? '7 Day' : '5 Day'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(prev => subWeeks(prev, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(prev => addWeeks(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days Header - Updated with desktop colors */}
      <div className="grid border-b border-gray-300 bg-[#2A9BB5] rounded-t-lg" 
        style={{ 
          gridTemplateColumns: `40px repeat(${weekDays.length}, 1fr)` 
        }}>
        <div className="p-1 text-center border-r border-gray-300 bg-[#2EBDAE]" />
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-1 text-center border-r border-gray-300 last:border-r-0">
            <div className="text-xs font-medium text-white/80">
              {format(day, 'EEE')}
            </div>
            <div className="text-xs font-medium text-white">
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid - Updated with desktop colors */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-w-full">
          <div className="grid" style={{ 
            gridTemplateColumns: `40px repeat(${weekDays.length}, 1fr)` 
          }}>
            {/* Time Column */}
            <div className="sticky left-0 z-10 bg-[#2EBDAE]">
              {timeSlots.map((slot, idx) => (
                <div
                  key={slot.hour}
                  className={cn(
                    "flex items-center justify-center border-r border-t border-gray-300 h-[40px] -mt-[1px] first:mt-0",
                    idx === timeSlots.length - 1 && "border-b border-gray-300"
                  )}
                >
                  <span className="text-[10px] text-white font-medium">{slot.display}</span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="relative border-r border-gray-300 last:border-r-0">
                {timeSlots.map((slot, idx) => (
                  <div
                    key={`${day.toISOString()}-${slot.hour}`}
                    className={cn(
                      "relative border-t border-gray-300 h-[40px] -mt-[1px] first:mt-0",
                      idx === timeSlots.length - 1 && "border-b border-gray-300"
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
                        <div key={task.id} className="absolute inset-x-0 top-0 p-0.5">
                          <WeeklyTaskCard task={task} />
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
