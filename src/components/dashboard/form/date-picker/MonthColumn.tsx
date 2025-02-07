
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths } from "date-fns";
import { useEffect, useRef } from "react";

interface MonthColumnProps {
  currentDate: Date;
  tempDate: Date;
  onMonthSelect: (monthIndex: number) => void;
}

export function MonthColumn({ currentDate, tempDate, onMonthSelect }: MonthColumnProps) {
  const selectedMonthIndex = tempDate.getMonth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const months = [
    format(subMonths(tempDate, 1), 'MMM'),
    format(tempDate, 'MMM'),
    format(addMonths(tempDate, 1), 'MMM')
  ];

  const monthIndices = [
    (selectedMonthIndex - 1 + 12) % 12,
    selectedMonthIndex,
    (selectedMonthIndex + 1) % 12
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
  }, [selectedMonthIndex]);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += e.deltaY;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 pb-2">Month</div>
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="space-y-3 px-1"
      >
        {months.map((month, index) => (
          <button
            key={month}
            type="button"
            onClick={() => onMonthSelect(monthIndices[index])}
            className={cn(
              "w-full h-10 px-3 text-sm font-medium text-center hover:bg-accent rounded-md transition-colors border border-gray-200",
              tempDate && format(tempDate, 'MMM') === month && "bg-[#1e1b4b] text-white"
            )}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
}
