import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";

interface MonthColumnProps {
  currentDate: Date;
  tempDate: Date;
  onMonthSelect: (monthIndex: number) => void;
}

export function MonthColumn({ currentDate, tempDate, onMonthSelect }: MonthColumnProps) {
  const months = Array.from({ length: 5 }, (_, i) => 
    format(addMonths(new Date(currentDate.getFullYear(), currentDate.getMonth() - 2), i), 'MMM')
  );

  return (
    <div className="flex flex-col space-y-2 overflow-hidden">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 py-1">Month</div>
      <div className="space-y-1 px-1 overflow-y-auto">
        {months.map((month) => (
          <button
            key={month}
            type="button"
            className={cn(
              "w-full px-3 py-2 text-sm text-center hover:bg-accent rounded-md transition-colors",
              tempDate && format(tempDate, 'MMM') === month && "bg-[#1e1b4b] text-white"
            )}
            onClick={() => {
              const monthIndex = months.indexOf(month);
              const targetDate = addMonths(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 2),
                monthIndex
              );
              onMonthSelect(targetDate.getMonth());
            }}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
}