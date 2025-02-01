import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeeklyDayHeader } from "./calendar/WeeklyDayHeader";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { DragDropContext } from "react-beautiful-dnd";
import { useWeeklyCalendar } from "@/hooks/use-weekly-calendar";
import { useState } from "react";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const currentDate = initialDate || new Date();
  const [showFullWeek, setShowFullWeek] = useState(true);
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4); // Friday if showing 5 days
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  const {
    unscheduledTasks,
    scheduledTasks,
    visitsPerDay,
    handleDragEnd
  } = useWeeklyCalendar(weekStart, weekEnd, weekDays);

  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 w-full max-w-[95%] mx-auto">
        <div className="flex-1">
          <CalendarHeader 
            monthYear={monthYear}
            onNextMonth={() => {}}
            onPreviousMonth={() => {}}
            showWeekly={true}
          />

          <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
            <WeeklyDayHeader 
              weekDays={weekDays} 
              visitsPerDay={visitsPerDay}
              showFullWeek={showFullWeek}
              onToggleView={() => setShowFullWeek(!showFullWeek)}
            />
            <WeeklyCalendarGrid 
              weekDays={weekDays}
              timeSlots={timeSlots}
              scheduledTasks={scheduledTasks}
            />
          </div>
        </div>

        <UnscheduledTasks tasks={unscheduledTasks} />
      </div>
    </DragDropContext>
  );
}