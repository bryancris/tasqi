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
      "w-full"
    )}>
      {/* Empty cell for time column with toggle button */}
      <div className="p-4 border-r bg-gray-50 relative">
        <Button
          variant="outline"
          onClick={onToggleView}
          className="absolute top-2 left-2 text-sm"
          size="sm"
        >
          {showFullWeek ? '5 Day' : '7 Day'}
        </Button>
      </div>
      
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="p-4 text-center border-r last:border-r-0 bg-gray-50"
        >
          <div className="font-semibold uppercase text-sm text-gray-600">
            {format(day, 'EEE')}
          </div>
          <div className="text-lg font-medium">
            {format(day, 'd')}
          </div>
          <div className="text-xs text-gray-500">
            {visitsPerDay[index]}
          </div>
        </div>
      ))}
    </div>
  );
}