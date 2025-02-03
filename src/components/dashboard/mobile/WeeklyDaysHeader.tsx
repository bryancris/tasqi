import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyDaysHeaderProps {
  weekDays: Date[];
  showFullWeek: boolean;
}

export function WeeklyDaysHeader({ weekDays, showFullWeek }: WeeklyDaysHeaderProps) {
  return (
    <div className={cn(
      "grid border-b sticky top-0 bg-[#E5DEFF]",
      showFullWeek ? "grid-cols-8" : "grid-cols-6"
    )}>
      {/* Time column header */}
      <div className="p-2 text-center border-r">
        <div className="bg-[#2563eb] text-white rounded-lg p-2 text-sm">
          <div className="text-xs font-medium">Day</div>
          <div className="text-lg font-bold">7</div>
        </div>
      </div>
      {/* Days */}
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="p-2 text-center border-r last:border-r-0"
        >
          <div className="text-sm font-medium text-[#6B7280]">
            {format(day, 'EEE')}
          </div>
          <div className="text-base font-semibold text-[#374151]">
            {format(day, 'd')}
          </div>
        </div>
      ))}
    </div>
  );
}