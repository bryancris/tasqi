
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
          className="h-8 text-xs px-3 font-medium text-white bg-gradient-to-r from-[#0EA5E9] to-[#2A9BB5] border-2 border-[#0EA5E9]/50 hover:from-[#0990D3] hover:to-[#248A9F] hover:border-[#0EA5E9]/70"
        >
          {showFullWeek ? '7 Day' : '5 Day'}
        </Button>
      </div>
      
      <div className="flex items-center gap-2 min-w-[80px]">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-gradient-to-r from-[#B2E3EA] to-[#83C5D2] border border-[#83C5D2] hover:bg-[#EA384C] hover:border-[#EA384C] hover:from-transparent hover:to-transparent"
          onClick={onPreviousWeek}
        >
          <ChevronLeft className="h-4 w-4 text-black hover:text-white" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-gradient-to-r from-[#B2E3EA] to-[#83C5D2] border border-[#83C5D2] hover:bg-[#EA384C] hover:border-[#EA384C] hover:from-transparent hover:to-transparent"
          onClick={onNextWeek}
        >
          <ChevronRight className="h-4 w-4 text-black hover:text-white" />
        </Button>
      </div>
    </div>
  );
}
