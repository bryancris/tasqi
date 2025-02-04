
import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addWeeks, subWeeks, parseISO } from "date-fns";
import { WeeklyViewHeader } from "./WeeklyViewHeader";
import { WeeklyDaysHeader } from "./WeeklyDaysHeader";
import { WeeklyTimeGrid } from "./WeeklyTimeGrid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "../TaskBoard";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";

export function MobileWeeklyView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFullWeek, setShowFullWeek] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: showFullWeek ? 0 : 1 });
  const weekEnd = showFullWeek 
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : addDays(weekStart, 4);
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      display: `${hour}\nAM`
    };
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'scheduled')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          // Invalidate and refetch tasks when changes occur
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = typeof active.id === 'string' ? parseInt(active.id, 10) : active.id;
    const [dayIndex, timeIndex] = over.id.toString().split('-').map(Number);
    const newDate = weekDays[dayIndex];
    const newHour = timeSlots[timeIndex].hour;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          date: format(newDate, 'yyyy-MM-dd'),
          start_time: `${newHour}:00`,
          end_time: `${newHour + 1}:00`,
          status: 'scheduled'
        })
        .eq('id', taskId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: "Task rescheduled",
        description: "The task has been successfully moved to the new time slot.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-144px)] bg-white">
      <WeeklyViewHeader
        currentDate={currentDate}
        showFullWeek={showFullWeek}
        onPreviousWeek={() => setCurrentDate(prev => subWeeks(prev, 1))}
        onNextWeek={() => setCurrentDate(prev => addWeeks(prev, 1))}
        onToggleView={() => setShowFullWeek(!showFullWeek)}
      />
      <WeeklyDaysHeader
        weekDays={weekDays}
        showFullWeek={showFullWeek}
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <WeeklyTimeGrid
          timeSlots={timeSlots}
          weekDays={weekDays}
          showFullWeek={showFullWeek}
          tasks={tasks}
        />
      </DndContext>
    </div>
  );
}
