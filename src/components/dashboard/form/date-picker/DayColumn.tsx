import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DayColumnProps {
  tempDate: Date;
  onDaySelect: (day: number) => void;
}

export function DayColumn({ tempDate, onDaySelect }: DayColumnProps) {
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div className="flex flex-col space-y-2 overflow-hidden">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 py-1">Day</div>
      <div className="space-y-1 px-1 overflow-y-auto">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            className={cn(
              "w-full px-3 py-2 text-sm text-center hover:bg-accent rounded-md transition-colors",
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