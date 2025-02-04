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
    <div className="flex w-full border-b border-gray-200">
      {/* Time column header */}
      <div className="w-20 min-w-[80px] bg-[#B2E3EA] border-r border-gray-200">
        <div className="h-[100px] flex items-center justify-center">
          <Button
            variant="outline"
            onClick={onToggleView}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-none text-sm"
            size="sm"
          >
            {showFullWeek ? '5 Day' : '7 Day'}
          </Button>
        </div>
      </div>

      {/* Days grid */}
      <div className="flex-1">
        <div className={cn(
          "grid h-[100px]",
          showFullWeek ? "grid-cols-7" : "grid-cols-5",
          "divide-x divide-gray-200"
        )}>
          {weekDays.map((day, index) => (
            <div 
              key={index}
              className="py-4 text-center bg-[#B2E3EA]"
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
    </div>
  );
}