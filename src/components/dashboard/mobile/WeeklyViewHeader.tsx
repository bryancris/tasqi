
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeeklyViewHeaderProps {
  currentDate: Date;
  showFullWeek: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToggleView: () => void;
}

export function WeeklyViewHeader({
  currentDate,
  showFullWeek,
  onPreviousWeek,
  onNextWeek,
  onToggleView,
}: WeeklyViewHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-700 truncate max-w-[100px]">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <Button
          variant="outline"
          onClick={onToggleView}
          className="h-8 text-xs px-3"
        >
          {showFullWeek ? '7 Day' : '5 Day'}
        </Button>
      </div>
      
      <div className="flex items-center gap-2 min-w-[80px]">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onPreviousWeek}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNextWeek}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
