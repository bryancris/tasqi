
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
    <div className="flex items-center justify-between px-2 border-b bg-white w-full max-w-[100vw]">
      <div className="flex items-center gap-2 py-4">
        <h2 className="text-lg font-semibold text-gray-700 truncate max-w-[120px]">
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
      
      <div className="flex items-center gap-2">
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
