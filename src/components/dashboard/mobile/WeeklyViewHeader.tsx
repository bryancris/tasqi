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
    <div className="flex items-center justify-between p-4 border-b bg-[#E5DEFF]">
      <h2 className="text-lg font-semibold text-gray-700">
        {format(currentDate, 'MMMM yyyy')}
      </h2>
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
          onClick={onToggleView}
          className="h-8 text-xs"
        >
          {showFullWeek ? '5 Day' : '7 Day'}
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