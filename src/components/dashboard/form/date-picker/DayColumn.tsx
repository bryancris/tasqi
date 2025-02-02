import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef } from "react";

interface DayColumnProps {
  tempDate: Date;
  onDaySelect: (day: number) => void;
}

export function DayColumn({ tempDate, onDaySelect }: DayColumnProps) {
  const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
  const selectedDay = tempDate.getDate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Calculate visible range (6 items)
  const itemHeight = 40; // Height of each button
  const visibleCount = 6;
  const containerHeight = visibleCount * itemHeight;

  return (
    <div className="flex flex-col space-y-2" style={{ height: containerHeight }}>
      <div className="text-sm font-medium text-center bg-background z-10">Day</div>
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="relative flex-1 overflow-y-auto scrollbar-hide"
        style={{ height: `${containerHeight - 24}px` }}
      >
        <div className="absolute inset-0">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onDaySelect(parseInt(day))}
              className={cn(
                "absolute w-full h-[40px] px-3 text-sm font-semibold text-center hover:bg-accent rounded-md transition-colors",
                tempDate && format(tempDate, 'dd') === day && "bg-[#1e1b4b] text-white"
              )}
              style={{
                top: `${(parseInt(day) - 1) * itemHeight}px`,
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}