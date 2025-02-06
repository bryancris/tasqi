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

// Separate component for the calendar cell to properly handle hooks
const CalendarCell = ({ 
  day, 
  timeSlot, 
  tasks,
  isLastRow,
  isLastColumn,
  isFirstColumn
}: { 
  day: Date;
  timeSlot: { hour: number; display: string };
  tasks: Task[];
  isLastRow: boolean;
  isLastColumn: boolean;
  isFirstColumn: boolean;
}) => {
  const formattedDate = format(day, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({
    id: `${formattedDate}-${timeSlot.hour}`,
    data: {
      date: formattedDate,
      hour: timeSlot.hour
    }
  });

  const tasksForThisSlot = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
    const [taskHour] = task.start_time.split(':').map(Number);
    return taskDate === formattedDate && taskHour === timeSlot.hour;
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative",
        "h-[60px] min-h-[60px]",
        "border-t border-slate-200",
        isLastRow && "border-b border-slate-300",
        isLastColumn && "border-r border-slate-300",
        isFirstColumn && "border-l border-slate-300",
        isOver && "bg-blue-50/50",
        "transition-colors duration-200"
      )}
    >
      {tasksForThisSlot.map((task) => (
        <div key={task.id} className="absolute inset-0 p-0.5">
          <TaskCard
            task={task}
            index={0}
            isDraggable={true}
            view="weekly"
          />
        </div>
      ))}
    </div>
  );
};

export function WeeklyCalendarGrid({ weekDays, timeSlots, scheduledTasks, showFullWeek }: WeeklyCalendarGridProps) {
  return (
    <div className="relative bg-white rounded-lg shadow-sm">
      <div className="grid grid-cols-[auto_repeat(7,1fr)]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-300 p-4" /> {/* Time column header spacer */}
        {weekDays.map((day, index) => (
          <div
            key={day.toISOString()}
            className={cn(
              "px-2 py-4 text-center border-b border-slate-300",
              "bg-slate-50"
            )}
          >
            <div className="font-medium text-slate-900">{format(day, 'EEE')}</div>
            <div className="text-sm text-slate-500">{format(day, 'd')}</div>
          </div>
        ))}

        {/* Time slots and cells */}
        {timeSlots.map((timeSlot, rowIndex) => (
          <React.Fragment key={timeSlot.hour}>
            <div className="w-20 px-4 py-3 text-right text-sm text-slate-500 bg-slate-50 border-r border-slate-300">
              {timeSlot.display}
            </div>
            {weekDays.map((day, colIndex) => (
              <CalendarCell
                key={`${day.toISOString()}-${timeSlot.hour}`}
                day={day}
                timeSlot={timeSlot}
                tasks={scheduledTasks}
                isLastRow={rowIndex === timeSlots.length - 1}
                isLastColumn={colIndex === weekDays.length - 1}
                isFirstColumn={colIndex === 0}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}