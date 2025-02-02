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

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += e.deltaY;
    }
  };

  // Calculate visible range (5 items)
  const itemHeight = 40; // Height of each button
  const visibleCount = 5;
  const containerHeight = visibleCount * itemHeight;

  return (
    <div className="flex flex-col space-y-2" style={{ height: containerHeight }}>
      <div className="text-sm font-medium text-center bg-background z-10">Month</div>
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="relative flex-1 overflow-y-auto scrollbar-hide"
        style={{ height: `${containerHeight - 24}px` }}
      >
        <div className="absolute inset-0">
          {months.map((month, index) => (
            <button
              key={month}
              type="button"
              onClick={() => onMonthSelect(index)}
              className={cn(
                "absolute w-full h-[40px] px-3 text-sm font-semibold text-center hover:bg-accent rounded-md transition-colors",
                tempDate && format(tempDate, 'MMM') === month && "bg-[#1e1b4b] text-white"
              )}
              style={{
                top: `${index * itemHeight}px`,
              }}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}