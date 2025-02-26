
import { useState } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { WeeklyViewHeader } from "./WeeklyViewHeader";
import { WeeklyDaysHeader } from "./WeeklyDaysHeader";
import { WeeklyTimeGrid } from "./WeeklyTimeGrid";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useWeeklyCalendar } from "@/hooks/use-weekly-calendar";

export function MobileWeeklyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4);
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      display: `${hour}\nAM`
    };
  });

  const {
    scheduledTasks,
    handleDragEnd
  } = useWeeklyCalendar(weekStart, weekEnd, weekDays);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WeeklyViewHeader
        currentDate={currentDate}
        showFullWeek={showFullWeek}
        onPreviousWeek={() => setCurrentDate(prev => subWeeks(prev, 1))}
        onNextWeek={() => setCurrentDate(prev => addWeeks(prev, 1))}
        onToggleView={() => setShowFullWeek(!showFullWeek)}
      />
      <WeeklyDaysHeader
        weekDays={weekDays}
        showFullWeek={showFullWeek}
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <WeeklyTimeGrid
          timeSlots={timeSlots}
          weekDays={weekDays}
          scheduledTasks={scheduledTasks}
          showFullWeek={showFullWeek}
        />
      </DndContext>
    </div>
  );
}
