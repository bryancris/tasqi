import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  monthYear: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  showWeekly?: boolean;
  showFullWeek?: boolean;
  onToggleView?: () => void;
}

export function CalendarHeader({ 
  monthYear, 
  onPreviousMonth, 
  onNextMonth,
  showWeekly = false,
  showFullWeek,
  onToggleView
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold">{monthYear}</h2>
      </div>
      <div className="flex items-center space-x-4 ml-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {showWeekly && onToggleView && (
          <Button
            variant="outline"
            onClick={onToggleView}
            className="h-8 px-3 text-xs"
          >
            {showFullWeek ? '7 Day' : '5 Day'}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}