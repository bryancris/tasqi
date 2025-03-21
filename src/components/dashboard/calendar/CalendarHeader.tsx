
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
        <h2 className="text-xl font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">
          {monthYear}
        </h2>
      </div>
      
      <div className="flex items-center gap-2">
        {showWeekly && onToggleView && (
          <Button
            variant="outline"
            onClick={onToggleView}
            className="h-8 text-xs px-3 font-medium text-white bg-gradient-to-r from-[#0EA5E9] to-[#2A9BB5] border-2 border-[#0EA5E9]/50 hover:from-[#0990D3] hover:to-[#248A9F] hover:border-[#0EA5E9]/70"
          >
            {showFullWeek ? '5 Day' : '7 Day'}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-gradient-to-r from-[#B2E3EA] to-[#83C5D2] border border-[#83C5D2] hover:bg-[#EA384C] hover:border-[#EA384C] hover:from-transparent hover:to-transparent"
          onClick={onPreviousMonth}
        >
          <ChevronLeft className="h-4 w-4 text-black hover:text-white" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-gradient-to-r from-[#B2E3EA] to-[#83C5D2] border border-[#83C5D2] hover:bg-[#EA384C] hover:border-[#EA384C] hover:from-transparent hover:to-transparent"
          onClick={onNextMonth}
        >
          <ChevronRight className="h-4 w-4 text-black hover:text-white" />
        </Button>
      </div>
    </div>
  );
}
