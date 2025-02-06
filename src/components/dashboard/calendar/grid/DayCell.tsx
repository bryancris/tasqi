import React from 'react';
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
}

export function DayCell({ day, timeSlot, tasks, dayIndex }: DayCellProps) {
  const getTaskPosition = (task: Task) => {
    if (!task.start_time || !task.end_time) return null;

    const startHour = parseInt(task.start_time.split(':')[0]);
    const startMinute = parseInt(task.start_time.split(':')[1]);
    const endHour = parseInt(task.end_time.split(':')[0]);
    const endMinute = parseInt(task.end_time.split(':')[1]);

    // Only show task if it starts in this time slot
    if (startHour !== timeSlot.hour) return null;

    // Calculate duration in minutes
    const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    
    // For a one-hour task, heightPercentage should be 100%
    // For a 30-minute task, heightPercentage should be 50%
    const heightPercentage = Math.min((durationMinutes / 60) * 100, 100);
    
    // Calculate top position (0 for start at hour, 50 for start at half hour)
    const topPercentage = (startMinute / 60) * 100;

    return {
      height: `${heightPercentage}%`,
      top: `${topPercentage}%`,
      position: 'absolute' as const,
      left: '0px',
      right: '0px',
      zIndex: 10,
    };
  };

  return (
    <div
      className={cn(
        "min-h-[60px] relative p-0.5",
        "transition-all duration-200 ease-in-out",
        "border-t-2 border-gray-600",
        "hover:bg-gray-50",
        dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
      )}
    >
      {/* 30-minute marker */}
      <div className="absolute left-0 right-0 top-1/2 border-t border-gray-200" />
      
      {tasks.map((task, index) => {
        const position = getTaskPosition(task);
        if (!position) return null;

        return (
          <div key={task.id} style={position} className="w-full px-0.5">
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