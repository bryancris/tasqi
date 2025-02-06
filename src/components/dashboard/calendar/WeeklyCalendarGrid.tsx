import React from 'react';
import { Task } from "../TaskBoard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TimeColumn } from "./grid/TimeColumn";
import { DayCell } from "./grid/DayCell";
import { HeaderCell } from "./grid/HeaderCell";

interface WeeklyCalendarGridProps {
  weekDays: Date[];
  timeSlots: Array<{ hour: number; display: string }>;
  scheduledTasks: Task[];
  showFullWeek?: boolean;
}

export function WeeklyCalendarGrid({
  weekDays,
  timeSlots,
  scheduledTasks,
  showFullWeek = true,
}: WeeklyCalendarGridProps) {
  const getTasksForDayAndTime = (day: Date, hour: number) => {
    return scheduledTasks.filter((task) => {
      if (!task.date || !task.start_time) return false;
      const taskDate = new Date(task.date);
      const taskHour = parseInt(task.start_time.split(":")[0]);
      return (
        taskDate.getDate() === day.getDate() &&
        taskDate.getMonth() === day.getMonth() &&
        taskDate.getFullYear() === day.getFullYear() &&
        taskHour === hour
      );
    });
  };

  return (
    <div className={cn(
      "grid",
      showFullWeek ? "grid-cols-8" : "grid-cols-6",
      "divide-x divide-gray-600",
      "border border-gray-600 rounded-lg overflow-hidden",
      "bg-white shadow-sm"
    )}>
      {/* Time column header */}
      <div className="h-[100px] bg-[#E3F2F6] flex items-center justify-center relative z-10 border-b border-gray-600">
        <span className="text-gray-600 font-medium">Time</span>
      </div>

      {/* Day column headers */}
      {weekDays.map((day, index) => (
        <HeaderCell key={index} day={day} />
      ))}

      {/* Time slots */}
      {timeSlots.map((timeSlot) => (
        <div key={timeSlot.hour} className="contents">
          {/* Time label */}
          <TimeColumn timeSlot={timeSlot} />

          {/* Day cells */}
          {weekDays.map((day, dayIndex) => {
            const dayTasks = getTasksForDayAndTime(day, timeSlot.hour);
            return (
              <DayCell
                key={`${day.toISOString()}-${timeSlot.hour}`}
                day={day}
                timeSlot={timeSlot}
                tasks={dayTasks}
                dayIndex={dayIndex}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}