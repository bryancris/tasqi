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
      
      {tasks.map((task, index) => (
        <div key={task.id} className="text-[10px] leading-tight relative z-10">
          <TaskCard 
            key={task.id} 
            task={task} 
            index={index}
            view="weekly"
          />
        </div>
      ))}
    </div>
  );
}