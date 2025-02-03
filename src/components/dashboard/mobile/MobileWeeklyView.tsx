import { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks } from "date-fns";
import { WeeklyViewHeader } from "./WeeklyViewHeader";
import { WeeklyDaysHeader } from "./WeeklyDaysHeader";
import { WeeklyTimeGrid } from "./WeeklyTimeGrid";

export function MobileWeeklyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  
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

  const handlePreviousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] bg-white">
      <WeeklyViewHeader
        currentDate={currentDate}
        showFullWeek={showFullWeek}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onToggleView={() => setShowFullWeek(!showFullWeek)}
      />
      <WeeklyDaysHeader
        weekDays={weekDays}
        showFullWeek={showFullWeek}
      />
      <WeeklyTimeGrid
        timeSlots={timeSlots}
        weekDays={weekDays}
        showFullWeek={showFullWeek}
      />
    </div>
  );
}