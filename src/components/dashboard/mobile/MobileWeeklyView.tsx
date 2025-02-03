import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileWeeklyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  
  // Start from Sunday if showing full week, Monday if showing 5 days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4);
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  const handlePreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFullWeek(!showFullWeek)}
            className="h-8 text-xs"
          >
            {showFullWeek ? '5 Day' : '7 Day'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days header */}
      <div className={cn(
        "grid border-b sticky top-0 bg-white z-10",
        showFullWeek ? "grid-cols-7" : "grid-cols-5"
      )}>
        {weekDays.map((day, index) => (
          <div 
            key={index}
            className="p-2 text-center border-r last:border-r-0"
          >
            <div className="text-sm font-medium text-gray-600">
              {format(day, 'EEE')}
            </div>
            <div className="text-base font-semibold">
              {format(day, 'd')}
            </div>
            <div className="text-xs text-gray-500">
              0 Tasks
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {timeSlots.map((time, timeIndex) => (
            <div 
              key={timeIndex} 
              className={cn(
                "grid",
                showFullWeek ? "grid-cols-7" : "grid-cols-5",
                "min-h-[80px]"
              )}
            >
              {weekDays.map((day, dayIndex) => (
                <div 
                  key={dayIndex}
                  className={cn(
                    "p-2 border-r last:border-r-0 relative",
                    "hover:bg-gray-50/80 transition-colors",
                    timeIndex % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <div className="absolute top-0 left-2 text-xs text-gray-400">
                    {dayIndex === 0 && time}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}