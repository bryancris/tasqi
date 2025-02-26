
import { useState } from "react";
import { format, addWeeks, subWeeks } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useTasks } from "@/hooks/use-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileWeeklyView } from "./mobile/MobileWeeklyView";

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const { tasks } = useTasks();
  const isMobile = useIsMobile();
  
  const unscheduledTasks = tasks?.filter(task => !task.date || !task.start_time) || [];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    console.log('Drag ended:', result);
  };

  if (isMobile) {
    return <MobileWeeklyView />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Section (Will contain search bar) */}
      <div className="h-16 border-b bg-white">
        {/* Search bar will be added here */}
      </div>

      {/* Controls Row - Contains calendar controls and unscheduled tasks */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b">
        {/* Left section - empty to align with Add Task */}
        <div className="w-[200px]" /> {/* Width matches sidebar Add Task width */}

        {/* Center section - Calendar controls */}
        <div className="flex items-center gap-4">
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

        {/* Right section - Unscheduled Tasks header */}
        <div className="w-[200px]">
          <h3 className="text-base font-medium text-gray-700">Unscheduled Tasks</h3>
        </div>
      </div>

      {/* Main Content Area - Wrapped in a single DragDropContext */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* Calendar Grid */}
          <div className="flex-1">
            <WeeklyCalendarGrid 
              currentDate={currentDate}
              showFullWeek={showFullWeek}
              className="scrollbar-hide"
            />
          </div>

          {/* Unscheduled Tasks Section */}
          <div className="w-[320px] border-l">
            <UnscheduledTasks tasks={unscheduledTasks} />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
