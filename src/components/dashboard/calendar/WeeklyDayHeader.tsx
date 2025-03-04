
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface WeeklyDayHeaderProps {
  weekDays: Date[];
  visitsPerDay: string[];
  showFullWeek: boolean;
  onToggleView: () => void;
}

export function WeeklyDayHeader({ weekDays, visitsPerDay, showFullWeek, onToggleView }: WeeklyDayHeaderProps) {
  return (
    <div className="contents">
      {/* Time column header */}
      <div className="bg-[#B2E3EA] border-r border-gray-200 row-start-1 row-end-2">
        <div className="h-[100px] flex items-center justify-center">
          <Button
            variant="outline"
            onClick={onToggleView}
            className="text-white border-2 border-[#0EA5E9]/50 text-sm bg-gradient-to-r from-[#0EA5E9] to-[#2A9BB5] hover:from-[#0990D3] hover:to-[#248A9F] hover:border-[#0EA5E9]/70"
            size="sm"
          >
            {showFullWeek ? '5 Day' : '7 Day'}
          </Button>
        </div>
      </div>

      {/* Days headers */}
      {weekDays.map((day, index) => (
        <div 
          key={index}
          className="py-4 text-center bg-[#B2E3EA] border-r border-gray-200 last:border-r-0 row-start-1 row-end-2"
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
