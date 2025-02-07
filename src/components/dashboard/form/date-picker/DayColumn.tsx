
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef } from "react";

interface DayColumnProps {
  tempDate: Date;
  onDaySelect: (day: number) => void;
}

export function DayColumn({ tempDate, onDaySelect }: DayColumnProps) {
  const selectedDay = tempDate.getDate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const daysInMonth = new Date(
    tempDate.getFullYear(),
    tempDate.getMonth() + 1,
    0
  ).getDate();

  const days = Array.from(
    { length: daysInMonth },
    (_, i) => String(i + 1).padStart(2, '0')
  );

  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedButton = scrollContainerRef.current.children[selectedDay - 1] as HTMLElement;
      if (selectedButton) {
        const containerHeight = scrollContainerRef.current.clientHeight;
        const buttonTop = selectedButton.offsetTop;
        const buttonHeight = selectedButton.clientHeight;
        
        scrollContainerRef.current.scrollTop = buttonTop - (containerHeight / 2) + (buttonHeight / 2);
      }
    }
  }, [selectedDay]);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += e.deltaY;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 pb-2">Day</div>
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="space-y-3 px-1 max-h-[250px] overflow-y-auto scrollbar-hide"
      >
        {days.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onDaySelect(parseInt(day))}
            className={cn(
              "w-full h-10 px-3 text-sm font-medium text-center hover:bg-accent rounded-md transition-colors border border-gray-200",
              tempDate && format(tempDate, 'dd') === day && "bg-[#1e1b4b] text-white"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
