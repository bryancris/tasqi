
import { useState } from "react";
import { format, addWeeks, subWeeks } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useTasks } from "@/hooks/use-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileWeeklyView } from "./mobile/MobileWeeklyView";
import { Droppable } from "react-beautiful-dnd";

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const { tasks } = useTasks();
  const isMobile = useIsMobile();
  
  // Filter unscheduled tasks based on specific criteria
  const unscheduledTasks = tasks?.filter(task => 
    task.status === 'unscheduled' && 
    !task.date && 
    !task.start_time && 
    !task.completed_at
  ) || [];

  if (isMobile) {
    return <MobileWeeklyView />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Controls Row - Now properly positioned below the global header */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b">
        <div className="w-[200px]" />
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-700">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              onClick={() => setShowFullWeek(!showFullWeek)}
              className="h-8 px-3 text-xs font-medium text-white bg-gradient-to-r from-[#0EA5E9] to-[#2A9BB5] border-2 border-[#0EA5E9]/50 hover:from-[#0990D3] hover:to-[#248A9F] hover:border-[#0EA5E9]/70"
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
        <div className="w-[200px]">
          <h3 className="text-base font-medium text-gray-700">Unscheduled Tasks</h3>
        </div>
      </div>

      {/* Main Content Area */}
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
        <Droppable droppableId="unscheduled-tasks">
          {(provided) => (
            <div 
              className="w-[320px] border-l"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <UnscheduledTasks tasks={unscheduledTasks} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}
