import React from 'react';
import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Task } from "../../TaskBoard";
import { TaskCard } from "../../TaskCard";
import { cn } from "@/lib/utils";

interface DayCellProps {
  day: Date;
  timeSlot: {
    hour: number;
    display: string;
  };
  tasks: Task[];
  dayIndex: number;
  isLastRow?: boolean;
}

export function DayCell({ day, timeSlot, tasks, dayIndex, isLastRow }: DayCellProps) {
  const formattedDate = format(day, 'yyyy-MM-dd');
  
  const { setNodeRef, isOver } = useDroppable({
    id: `${formattedDate}-${timeSlot.hour}`,
    data: {
      date: formattedDate,
      hour: timeSlot.hour
    }
  });

  const getTaskPosition = (task: Task) => {
    if (!task.start_time || !task.end_time) return null;

    const startHour = parseInt(task.start_time.split(':')[0]);
    const startMinute = parseInt(task.start_time.split(':')[1]);
    const endHour = parseInt(task.end_time.split(':')[0]);
    const endMinute = parseInt(task.end_time.split(':')[1]);

    if (startHour !== timeSlot.hour) return null;

    const durationMinutes = ((endHour - startHour) * 60) + (endMinute - startMinute);
    const heightPercentage = (durationMinutes / 60) * 100;
    const topPercentage = (startMinute / 60) * 100;

    return {
      height: `${heightPercentage}%`,
      top: `${topPercentage}%`,
      left: '1px',
      right: '1px',
      position: 'absolute' as const,
      zIndex: 10
    };
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-[60px] min-h-[60px]",
        "relative",
        "transition-all duration-200 ease-in-out",
        "border-t-2 border-gray-600",
        isLastRow && "border-b-2",
        "hover:bg-gray-50",
        dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
      )}
    >
      {/* 30-minute marker */}
      <div className="absolute left-0 right-0 top-1/2 border-t border-gray-200" />
      
      {/* Tasks */}
      {tasks.map((task, index) => {
        const position = getTaskPosition(task);
        if (!position) return null;

        return (
          <div key={task.id} style={position}>
            <TaskCard 
              key={task.id} 
              task={task} 
              index={index}
              view="weekly"
            />
          </div>
        );
      })}
    </div>
  );
}