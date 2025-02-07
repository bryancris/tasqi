
import React from 'react';
import { useDroppable } from "@dnd-kit/core";
import { format, parseISO, startOfDay } from "date-fns";
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

    const [startHour, startMinute] = task.start_time.split(':').map(Number);
    const [endHour, endMinute] = task.end_time.split(':').map(Number);

    // Only show task if it starts in this time slot
    if (startHour !== timeSlot.hour) return null;

    // Calculate duration in minutes
    const durationInMinutes = ((endHour - startHour) * 60) + (endMinute - startMinute);
    
    // Calculate height (1px per minute)
    const heightInPixels = durationInMinutes;
    
    // Calculate top offset based on start minute (1px per minute)
    const topOffset = startMinute;

    return {
      height: `${heightInPixels}px`,
      top: `${topOffset}px`,
      left: '1px',
      right: '1px',
      position: 'absolute' as const,
      zIndex: 10
    };
  };

  // Filter tasks for this day and time slot
  const tasksForCell = tasks.filter(task => {
    if (!task.date || !task.start_time) return false;
    
    // Ensure we're comparing the dates without time components
    const taskDate = startOfDay(parseISO(task.date));
    const cellDate = startOfDay(day);
    const [taskStartHour] = task.start_time.split(':').map(Number);
    
    // Compare the dates and hours
    return +taskDate === +cellDate && taskStartHour === timeSlot.hour;
  });

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
      {tasksForCell.map((task, index) => {
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
