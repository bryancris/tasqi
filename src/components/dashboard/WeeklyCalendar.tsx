
import { useState } from "react";
import { format, addWeeks, subWeeks } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { DragDropContext, DropResult } from "react-beautiful-dnd";

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    console.log('Drag ended:', result);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white sticky top-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-700 truncate max-w-[100px]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            onClick={() => setShowFullWeek(!showFullWeek)}
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
            onClick={() => setCurrentDate(prev => subWeeks(prev, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate(prev => addWeeks(prev, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <DragDropContext onDragEnd={handleDragEnd}>
            <WeeklyCalendarGrid 
              currentDate={currentDate}
              showFullWeek={showFullWeek}
              className="scrollbar-hide"
            />
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
