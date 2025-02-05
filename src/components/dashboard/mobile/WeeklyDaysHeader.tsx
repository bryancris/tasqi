
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyDaysHeaderProps {
  weekDays: Date[];
  showFullWeek: boolean;
}

export function WeeklyDaysHeader({ weekDays, showFullWeek }: WeeklyDaysHeaderProps) {
  return (
    <div className={cn(
      "grid border-b sticky top-0 bg-[#2A9BB5]", // Changed to a medium-dark teal color
      showFullWeek ? "grid-cols-8" : "grid-cols-6"
    )}>
      {/* Time column header */}
      <div className="p-2 text-center border-r" />
      {/* Days */}
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="p-2 text-center border-r last:border-r-0"
        >
          <div className="text-sm font-medium text-white/80">
            {format(day, 'EEE')}
          </div>
          <div className="text-xl font-light text-white tracking-wide">
            {format(day, 'd')}
          </div>
        </div>
      ))}
    </div>
  );
}
