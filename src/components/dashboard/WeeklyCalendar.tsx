
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
    <div className="flex h-full">
      {/* Left Column - Add Task */}
      <div className="w-[240px] pr-4">
        <div className="h-12 flex items-center">
          <Button variant="outline" className="w-full">
            Add Task
          </Button>
        </div>
      </div>

      {/* Center Column - Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Calendar Controls Row */}
        <div className="h-12 flex items-center justify-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              onClick={() => setShowFullWeek(!showFullWeek)}
              className="h-8 px-3 text-xs"
            >
              {showFullWeek ? '7 Day' : '5 Day'}
            </Button>
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

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <WeeklyCalendarGrid 
              currentDate={currentDate}
              showFullWeek={showFullWeek}
              className="scrollbar-hide"
            />
          </DragDropContext>
        </div>
      </div>

      {/* Right Column - Unscheduled Tasks */}
      <div className="w-[240px] pl-4">
        <div className="h-12 flex items-center">
          <h2 className="font-medium">Unscheduled Tasks</h2>
        </div>
      </div>
    </div>
  );
}
