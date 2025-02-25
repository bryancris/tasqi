
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarHeaderProps {
  monthYear: string;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  showWeekly?: boolean;
  showFullWeek?: boolean;
  onToggleView?: () => void;
}

export function CalendarHeader({
  monthYear,
  onNextMonth,
  onPreviousMonth,
  showWeekly,
  showFullWeek,
  onToggleView,
}: CalendarHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-700 truncate max-w-[120px]">
          {monthYear}
        </h2>
        {showWeekly && onToggleView && (
          <Button
            variant="outline"
            onClick={onToggleView}
            className="h-8 text-xs px-3"
          >
            {showFullWeek ? '7 Day' : '5 Day'}
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onPreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
