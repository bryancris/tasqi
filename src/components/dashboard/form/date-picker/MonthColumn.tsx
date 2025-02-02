import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";

interface MonthColumnProps {
  currentDate: Date;
  tempDate: Date;
  onMonthSelect: (monthIndex: number) => void;
}

export function MonthColumn({ currentDate, tempDate, onMonthSelect }: MonthColumnProps) {
  const selectedMonthIndex = tempDate.getMonth();
  const months = Array.from({ length: 12 }, (_, i) => 
    format(addMonths(new Date(currentDate.getFullYear(), 0), i), 'MMM')
  );

  // Calculate start index to show selected month in the middle when possible
  const startIdx = Math.max(0, Math.min(selectedMonthIndex - 2, months.length - 5));
  const visibleMonths = months.slice(startIdx, startIdx + 5);

  return (
    <div className="flex flex-col space-y-2 overflow-hidden">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 py-1">Month</div>
      <div className="space-y-1 px-1 overflow-y-auto scrollbar-hide">
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