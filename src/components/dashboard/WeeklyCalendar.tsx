
import { useState } from "react";
import { format, addWeeks, subWeeks } from 'date-fns';
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useTasks } from "@/hooks/use-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileWeeklyView } from "./mobile/MobileWeeklyView";
import { Droppable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarHeader } from "./calendar/CalendarHeader";

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const { tasks } = useTasks();
  const isMobile = useIsMobile();
  
  const unscheduledTasks = tasks?.filter(task => 
    task.status === 'unscheduled' && 
    !task.date && 
    !task.start_time && 
    !task.completed_at
  ) || [];
  
  const monthYear = format(currentDate, 'MMMM yyyy');
  
  const nextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };
  
  const previousWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  if (isMobile) {
    return <MobileWeeklyView />;
  }

  return (
    <Card className="w-full h-full mx-auto shadow-sm">
      <CardHeader className="pb-0">
        <CalendarHeader 
          monthYear={monthYear}
          onNextMonth={nextWeek}
          onPreviousMonth={previousWeek}
          showWeekly={true}
          showFullWeek={showFullWeek}
          onToggleView={() => setShowFullWeek(!showFullWeek)}
        />
      </CardHeader>
      
      <CardContent className="pt-6 h-[calc(100%-80px)]">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1">
              <WeeklyCalendarGrid 
                currentDate={currentDate}
                showFullWeek={showFullWeek}
                className="scrollbar-hide"
              />
            </div>

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
      </CardContent>
    </Card>
  );
}
