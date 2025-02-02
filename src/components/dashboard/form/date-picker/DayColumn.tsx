import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DayColumnProps {
  tempDate: Date;
  onDaySelect: (day: number) => void;
}

export function DayColumn({ tempDate, onDaySelect }: DayColumnProps) {
  const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
  const selectedDay = tempDate.getDate();
  const days = Array.from(
    { length: daysInMonth }, 
    (_, i) => String(i + 1).padStart(2, '0')
  );

  // Calculate start index to show selected day in the middle when possible
  const startIdx = Math.max(0, Math.min(selectedDay - 3, days.length - 5));
  const visibleDays = days.slice(startIdx, startIdx + 5);

  return (
    <div className="flex flex-col space-y-2 overflow-hidden">
      <div className="text-sm font-medium text-center sticky top-0 bg-background z-10 py-1">Day</div>
      <div className="space-y-1 px-1 overflow-y-auto scrollbar-hide">
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