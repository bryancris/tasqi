
import { useState } from "react";
import { format, addWeeks, subWeeks } from 'date-fns';
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useTasks } from "@/hooks/use-tasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileWeeklyView } from "./mobile/MobileWeeklyView";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const { tasks } = useTasks();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // If dropped outside a droppable area or dropped in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    try {
      // If task is being moved to a time slot
      if (destination.droppableId.includes('-')) {
        const [dateStr, hourStr] = destination.droppableId.split('-');
        const hour = parseInt(hourStr);
        
        // Update task with new date and time
        const { error } = await supabase
          .from('tasks')
          .update({
            date: dateStr,
            start_time: `${hour}:00`,
            end_time: `${hour + 1}:00`,
            status: 'scheduled'
          })
          .eq('id', draggableId);
          
        if (error) throw error;
      } 
      // If being moved to unscheduled area
      else if (destination.droppableId === 'unscheduled') {
        const { error } = await supabase
          .from('tasks')
          .update({
            date: null,
            start_time: null,
            end_time: null,
            status: 'unscheduled'
          })
          .eq('id', draggableId);
          
        if (error) throw error;
      }
      
      // Invalidate and refetch tasks
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: "Task updated",
        description: "The task has been successfully moved.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error updating task",
        description: "There was a problem updating the task.",
        variant: "destructive"
      });
    }
  };

  if (isMobile) {
    return <MobileWeeklyView />;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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

              <Droppable droppableId="unscheduled">
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
    </DragDropContext>
  );
}
