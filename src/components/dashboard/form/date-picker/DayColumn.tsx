
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";
import { useEffect, useRef } from "react";

interface DayColumnProps {
  tempDate: Date;
  onDaySelect: (day: number) => void;
}

export function DayColumn({ tempDate, onDaySelect }: DayColumnProps) {
  const selectedDay = tempDate.getDate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const days = [
    format(subDays(tempDate, 1), 'dd'),
    format(tempDate, 'dd'),
    format(addDays(tempDate, 1), 'dd')
  ];

  const dayNumbers = [
    parseInt(format(subDays(tempDate, 1), 'dd')),
    parseInt(format(tempDate, 'dd')),
    parseInt(format(addDays(tempDate, 1), 'dd'))
  ];

  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedButton = scrollContainerRef.current.children[1] as HTMLElement;
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
      <div className="text-sm font-medium text-center bg-background z-10 pb-2">Day</div>
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="space-y-3 px-1"
      >
        {days.map((day, index) => (
          <button
            key={day}
            type="button"
            onClick={() => onDaySelect(dayNumbers[index])}
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
