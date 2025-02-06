import React from 'react';
import { Task } from "../TaskBoard";
import { format, isSameDay, parseISO } from "date-fns";
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
      
      // Parse the task date string to a Date object using parseISO
      const taskDate = parseISO(task.date);
      const taskHour = parseInt(task.start_time.split(":")[0]);
      
      console.log('Comparing dates:', {
        taskDate: format(taskDate, 'yyyy-MM-dd'),
        day: format(day, 'yyyy-MM-dd'),
        taskHour,
        hour,
        isSameDay: isSameDay(taskDate, day)
      });
      
      return isSameDay(taskDate, day) && taskHour === hour;
    });
  };

  return (
    <div className="relative">
      <div className={cn(
        "grid",
        showFullWeek ? "grid-cols-8" : "grid-cols-6",
        "divide-x divide-gray-600",
        "border-2 border-gray-600 rounded-lg",
        "bg-white shadow-sm"
      )}>
        {/* Time column header */}
        <div className="h-[100px] bg-[#E3F2F6] flex items-center justify-center relative z-10 border-b-2 border-gray-600">
          <span className="text-gray-600 font-medium">Time</span>
        </div>

        {/* Day column headers */}
        {weekDays.map((day, index) => (
          <HeaderCell key={index} day={day} />
        ))}

        {/* Time slots */}
        {timeSlots.map((timeSlot, slotIndex) => (
          <React.Fragment key={timeSlot.hour}>
            {/* Time label */}
            <TimeColumn 
              timeSlot={timeSlot} 
              isLastRow={slotIndex === timeSlots.length - 1}
            />

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
                  isLastRow={slotIndex === timeSlots.length - 1}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}