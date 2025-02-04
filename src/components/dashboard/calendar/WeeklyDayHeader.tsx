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
    <div className="grid grid-cols-[80px_1fr] bg-[#B2E3EA] border-b border-gray-400">
      {/* Time column header */}
      <div className="h-[100px] border-r border-gray-400 flex items-center justify-center">
        <Button
          variant="outline"
          onClick={onToggleView}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-none text-sm"
          size="sm"
        >
          {showFullWeek ? '5 Day' : '7 Day'}
        </Button>
      </div>

      {/* Days grid */}
      <div className={cn(
        "grid grid-cols-5",
        showFullWeek && "grid-cols-7"
      )}>
        {weekDays.map((day, index) => (
          <div 
            key={index}
            className="h-[100px] py-4 text-center border-r border-gray-400 last:border-r-0"
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
    </div>
  );
}