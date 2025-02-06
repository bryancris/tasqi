import React from 'react';
import { Task } from "../TaskBoard";
import { format } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "../TaskCard";
import { cn } from "@/lib/utils";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: {
    hour: number;
    display: string;
  }[];
  scheduledTasks: Task[];
  showFullWeek: boolean;
}

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks, showFullWeek }: WeeklyCalendarGridProps) {
  return (
    <div className="relative">
      <div className="grid grid-cols-[auto_repeat(7,1fr)]">
        <div className="w-16" /> {/* Time column header spacer */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="px-2 py-3 text-center border-b border-gray-200 bg-gray-50"
          >
            <div className="font-medium">{format(day, 'EEE')}</div>
            <div className="text-sm text-gray-500">{format(day, 'd')}</div>
          </div>
        ))}

        {timeSlots.map((timeSlot, rowIndex) => (
          <React.Fragment key={timeSlot.hour}>
            <div className="w-16 px-2 py-3 text-right text-sm text-gray-500 border-r border-gray-200">
              {timeSlot.display}
            </div>
            {weekDays.map((day, colIndex) => {
              const formattedDate = format(day, 'yyyy-MM-dd');
              const { setNodeRef, isOver } = useDroppable({
                id: `${formattedDate}-${timeSlot.hour}`,
                data: {
                  date: formattedDate,
                  hour: timeSlot.hour
                }
              });

              const tasksForThisSlot = scheduledTasks.filter(task => {
                if (!task.date || !task.start_time) return false;
                const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
                const [taskHour] = task.start_time.split(':').map(Number);
                return taskDate === formattedDate && taskHour === timeSlot.hour;
              });

              return (
                <div
                  key={`${day.toISOString()}-${timeSlot.hour}`}
                  ref={setNodeRef}
                  className={cn(
                    "h-[60px] min-h-[60px] relative",
                    "border-t border-gray-200",
                    rowIndex === timeSlots.length - 1 && "border-b",
                    colIndex === weekDays.length - 1 && "border-r",
                    isOver && "bg-blue-50",
                    "transition-colors duration-200"
                  )}
                >
                  {tasksForThisSlot.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={0}
                      isDraggable={true}
                      view="weekly"
                    />
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}