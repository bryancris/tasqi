import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface YearColumnProps {
  currentDate: Date;
  tempDate: Date;
  onYearSelect: (year: number) => void;
}

export function YearColumn({ currentDate, tempDate, onYearSelect }: YearColumnProps) {
  const years = Array.from({ length: 10 }, (_, i) => 
    String(currentDate.getFullYear() - 5 + i)
  );

  return (
    <div className="flex flex-col space-y-2 overflow-hidden">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 py-1">Year</div>
      <div className="space-y-1 px-1 overflow-y-auto">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            className={cn(
              "w-full px-3 py-2 text-sm text-center hover:bg-accent rounded-md transition-colors",
              tempDate && format(tempDate, 'yyyy') === year && "bg-[#1e1b4b] text-white"
            )}
            onClick={() => onYearSelect(parseInt(year))}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}