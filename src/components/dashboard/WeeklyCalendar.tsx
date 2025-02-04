import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeeklyDayHeader } from "./calendar/WeeklyDayHeader";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { DndContext } from "@dnd-kit/core";
import { useWeeklyCalendar } from "@/hooks/use-weekly-calendar";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  
  // Start from Sunday if showing full week, Monday if showing 5 days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4); // Friday
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      display: `${hour}:00`
    };
  });

  const {
    unscheduledTasks,
    scheduledTasks,
    visitsPerDay,
    handleDragEnd
  } = useWeeklyCalendar(weekStart, weekEnd, weekDays);

  const monthYear = format(currentDate, 'MMMM yyyy');

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 w-full max-w-[95%] mx-auto">
        <div className="flex-1">
          <CalendarHeader 
            monthYear={monthYear}
            onNextMonth={handleNextWeek}
            onPreviousMonth={handlePreviousWeek}
            showWeekly={true}
          />

          <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
            <WeeklyCalendarGrid 
              weekDays={weekDays}
              timeSlots={timeSlots}
              scheduledTasks={scheduledTasks}
              showFullWeek={showFullWeek}
            />
          </div>
        </div>

        <UnscheduledTasks tasks={unscheduledTasks} />
      </div>
    </DndContext>
  );
}