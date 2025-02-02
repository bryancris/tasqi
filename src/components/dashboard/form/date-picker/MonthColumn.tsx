import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { useEffect, useRef } from "react";

interface MonthColumnProps {
  currentDate: Date;
  tempDate: Date;
  onMonthSelect: (monthIndex: number) => void;
}

export function MonthColumn({ currentDate, tempDate, onMonthSelect }: MonthColumnProps) {
  const selectedMonthIndex = tempDate.getMonth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const months = Array.from({ length: 12 }, (_, i) => 
    format(addMonths(new Date(currentDate.getFullYear(), 0), i), 'MMM')
  );

  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedButton = scrollContainerRef.current.children[selectedMonthIndex] as HTMLElement;
      if (selectedButton) {
        const containerHeight = scrollContainerRef.current.clientHeight;
        const buttonTop = selectedButton.offsetTop;
        const buttonHeight = selectedButton.clientHeight;
        
        scrollContainerRef.current.scrollTop = buttonTop - (containerHeight / 2) + (buttonHeight / 2);
      }
    }
  }, [selectedMonthIndex]);

  return (
    <div className="flex flex-col space-y-2 overflow-hidden h-[300px]">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 py-1">Month</div>
      <div 
        ref={scrollContainerRef}
        className="space-y-1 px-1 overflow-y-auto scrollbar-hide"
        style={{ height: 'calc(100% - 2rem)' }}
      >
        {months.map((month, index) => (
          <button
            key={month}
            type="button"
            className={cn(
              "w-full px-3 py-2 text-sm font-semibold text-center hover:bg-accent rounded-md transition-colors",
              tempDate && format(tempDate, 'MMM') === month && "bg-[#1e1b4b] text-white"
            )}
            onClick={() => onMonthSelect(index)}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
}