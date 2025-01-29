import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeeklyDayHeader } from "./calendar/WeeklyDayHeader";
import { WeeklyCalendarGrid } from "./calendar/WeeklyCalendarGrid";
import { UnscheduledTasks } from "./calendar/UnscheduledTasks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskBoard";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { useToast } from "@/hooks/use-toast";

interface WeeklyCalendarProps {
  initialDate?: Date;
}

export function WeeklyCalendar({ initialDate }: WeeklyCalendarProps) {
  const currentDate = initialDate || new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour}:00`;
  });

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
  });

  const scheduledTasks = tasks.filter(task => task.status === 'scheduled');
  const unscheduledTasks = tasks.filter(task => task.status === 'unscheduled');

  const visitsPerDay = weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => 
      task.date && isSameDay(parseISO(task.date), day)
    );
    return `${dayTasks.length} ${dayTasks.length === 1 ? 'Visit' : 'Visits'}`;
  });

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;

    const taskId = parseInt(draggableId);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // Optimistically update the UI
      const updatedTasks = [...tasks];
      const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
      
      if (destination.droppableId === 'unscheduled') {
        // Moving to unscheduled
        updatedTasks[taskIndex] = {
          ...task,
          status: 'unscheduled',
          date: null,
          start_time: null,
          end_time: null
        };

        // Update in database
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'unscheduled',
            date: null,
            start_time: null,
            end_time: null
          })
          .eq('id', taskId);

        if (error) throw error;
      } else {
        // Moving to a time slot
        const [day, time] = destination.droppableId.split('-');
        const newDate = weekDays[parseInt(day)];
        const hour = parseInt(time) + 8; // Convert index to hour (8:00 is index 0)
        
        updatedTasks[taskIndex] = {
          ...task,
          status: 'scheduled',
          date: format(newDate, 'yyyy-MM-dd'),
          start_time: `${hour}:00`,
          end_time: `${hour + 1}:00`
        };

        // Update in database
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'scheduled',
            date: format(newDate, 'yyyy-MM-dd'),
            start_time: `${hour}:00`,
            end_time: `${hour + 1}:00`
          })
          .eq('id', taskId);

        if (error) throw error;
      }

      // Update the cache immediately
      queryClient.setQueryData(['tasks'], updatedTasks);
      
      // Refetch to ensure we have the latest data
      await refetch();
      
      toast({
        title: "Task updated",
        description: "The task has been successfully moved.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      // Refetch to ensure UI is in sync with database
      await refetch();
    }
  };

  const monthYear = format(currentDate, 'MMMM yyyy');

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 w-full max-w-[95%] mx-auto">
        <div className="flex-1">
          <CalendarHeader 
            monthYear={monthYear}
            onNextMonth={() => {}}
            onPreviousMonth={() => {}}
            showWeekly={true}
          />

          <div className="border rounded-lg bg-white shadow-sm overflow-hidden mt-4">
            <WeeklyDayHeader weekDays={weekDays} visitsPerDay={visitsPerDay} />
            <WeeklyCalendarGrid 
              weekDays={weekDays}
              timeSlots={timeSlots}
              scheduledTasks={scheduledTasks}
            />
          </div>
        </div>

        <UnscheduledTasks tasks={unscheduledTasks} />
      </div>
    </DragDropContext>
  );
}