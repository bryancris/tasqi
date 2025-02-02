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

  return (
    <div className="flex flex-col space-y-2 overflow-hidden h-[300px]">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 py-1">Day</div>
      <div 
        ref={scrollContainerRef}
        className="space-y-1 px-1 overflow-y-auto scrollbar-hide"
        style={{ height: 'calc(100% - 2rem)' }}
      >
        {days.map((day) => (
          <button
            key={day}
            type="button"
            className={cn(
              "w-full px-3 py-2 text-sm font-semibold text-center hover:bg-accent rounded-md transition-colors",
              tempDate && format(tempDate, 'dd') === day && "bg-[#1e1b4b] text-white"
            )}
            onClick={() => onDaySelect(parseInt(day))}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}