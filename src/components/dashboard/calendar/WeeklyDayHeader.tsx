import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeeklyDayHeaderProps {
  weekDays: Date[];
  visitsPerDay: string[];
  showFullWeek: boolean;
  onToggleView: () => void;
}

export function WeeklyDayHeader({ weekDays, visitsPerDay, showFullWeek, onToggleView }: WeeklyDayHeaderProps) {
  return (
    <div className={cn(
      "grid border-b relative",
      showFullWeek ? "grid-cols-8" : "grid-cols-6",
      "w-full bg-[#B2E3EA]"
    )}>
      {/* Empty cell for time column with toggle button */}
      <div className="p-4 border-r bg-[#B2E3EA] w-[80px] flex items-center justify-center">
        <Button
          variant="outline"
          onClick={onToggleView}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-none text-sm"
          size="sm"
        >
          {showFullWeek ? '5 Day' : '7 Day'}
        </Button>
      </div>
      
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="p-4 text-center border-r last:border-r-0 bg-[#B2E3EA]"
        >
          <div className="font-semibold uppercase text-sm text-gray-600">
            {format(day, 'EEE')}
          </div>
          <div className="text-lg font-medium">
            {format(day, 'd')}
          </div>
          <div className="text-xs text-gray-500">
            {visitsPerDay[index].replace('Visit', 'Task').replace('Visits', 'Tasks')}
          </div>
        </div>
      ))}
    </div>
  );
}