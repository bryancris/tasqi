
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyDaysHeaderProps {
  weekDays: Date[];
  showFullWeek: boolean;
}

export function WeeklyDaysHeader({ weekDays, showFullWeek }: WeeklyDaysHeaderProps) {
  return (
    <div className={cn(
      "grid border-b sticky top-0 bg-[#2A9BB5] rounded-t-lg",
      showFullWeek ? "grid-cols-8" : "grid-cols-6"
    )}>
      {/* Time column header */}
      <div className="p-2 text-center border-r rounded-tl-lg" />
      {/* Days */}
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className={cn(
            "p-2 text-center border-r last:border-r-0",
            index === weekDays.length - 1 ? "rounded-tr-lg" : ""
          )}
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
