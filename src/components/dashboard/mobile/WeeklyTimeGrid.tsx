
import { Fragment } from "react";
import { format } from "date-fns";
import { ScheduledTask } from "@/types/task";
import { DraggableTask } from "./DraggableTask";
import { cn } from "@/lib/utils";

interface WeeklyTimeGridProps {
  timeSlots: Array<{ hour: number; display: string }>;
  weekDays: Date[];
  scheduledTasks: ScheduledTask[];
  showFullWeek: boolean;
}

export function WeeklyTimeGrid({
  timeSlots,
  weekDays,
  scheduledTasks,
  showFullWeek,
}: WeeklyTimeGridProps) {
  return (
    <div className="flex-1 overflow-x-hidden">
      <div className="relative flex h-full overflow-x-auto overflow-y-auto scrollbar-hide">
        {/* Time column */}
        <div className="sticky left-0 z-10 w-14 flex-none bg-white">
          <div className="relative h-full">
            {timeSlots.map((slot, idx) => (
              <div
                key={slot.hour}
                className={cn(
                  "flex items-center justify-center border-r border-t text-xs",
                  "h-[60px] -mt-[1px] first:mt-0",
                  idx === timeSlots.length - 1 && "border-b"
                )}
              >
                <span>{format(new Date().setHours(slot.hour), "ha")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex flex-1 overflow-x-auto scrollbar-hide">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 min-w-[100px] relative border-r last:border-r-0"
            >
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
                        format(new Date(task.scheduledAt), "yyyy-MM-dd") ===
                          format(day, "yyyy-MM-dd") &&
                        new Date(task.scheduledAt).getHours() === slot.hour
                    )
                    .map((task) => (
                      <DraggableTask key={task.id} task={task} />
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
