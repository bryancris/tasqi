import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { DragEndEvent } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { 
  filterScheduledTasks, 
  filterUnscheduledTasks, 
  calculateVisitsPerDay 
} from "@/utils/calendarUtils";
import {
  validateDateFormat,
  validateHourFormat,
  updateTaskToUnscheduled,
  updateTaskTime
} from "@/utils/taskUpdateUtils";

export function useWeeklyCalendar(weekStart: Date, weekEnd: Date, weekDays: Date[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      console.log('Fetching tasks for week:', { 
        weekStart: format(weekStart, 'yyyy-MM-dd'), 
        weekEnd: format(weekEnd, 'yyyy-MM-dd') 
      });
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      return data as Task[];
    },
  });

  useEffect(() => {
    console.log('Setting up real-time subscription');
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, weekStart, weekEnd]);

  const scheduledTasks = filterScheduledTasks(tasks);
  const unscheduledTasks = filterUnscheduledTasks(tasks);
  const visitsPerDay = calculateVisitsPerDay(weekDays, scheduledTasks);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = Number(active.id);
    const task = tasks?.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (over.id === 'unscheduled') {
        await updateTaskToUnscheduled(taskId);
      } else {
        // The cell ID format should be 'YYYY-MM-DD-HH'
        const cellParts = (over.id as string).split('-');
        if (cellParts.length !== 4) {
          throw new Error('Invalid cell ID format');
        }
        
        const dateStr = `${cellParts[0]}-${cellParts[1]}-${cellParts[2]}`;
        const hour = cellParts[3];
        
        console.log('Processing drop:', { dateStr, hour });
        
        validateDateFormat(dateStr);
        const hourNum = validateHourFormat(hour);
        
        const startTime = `${hourNum.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hourNum + 1).toString().padStart(2, '0')}:00:00`;
        
        await updateTaskTime({ 
          taskId, 
          dateStr, 
          startTime, 
          endTime 
        });
      }
      
      await queryClient.invalidateQueries({ 
        queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
      });

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
    }
  };

  return {
    tasks,
    scheduledTasks,
    unscheduledTasks,
    visitsPerDay,
    handleDragEnd
  };
}