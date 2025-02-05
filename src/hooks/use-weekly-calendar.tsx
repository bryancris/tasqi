import { format, parseISO } from "date-fns";
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
        // Extract date and hour from the cell ID
        const [dateStr, hour] = (over.id as string).split('-HH');
        
        console.log('Processing drop:', { dateStr, hour });
        
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00:00`;
        
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

async function updateTaskToUnscheduled(taskId: number) {
  const { error } = await supabase
    .from('tasks')
    .update({
      date: null,
      start_time: null,
      end_time: null,
      status: 'unscheduled'
    })
    .eq('id', taskId);

  if (error) throw error;
}

async function updateTaskTime({ 
  taskId, 
  dateStr, 
  startTime, 
  endTime 
}: { 
  taskId: number, 
  dateStr: string, 
  startTime: string, 
  endTime: string 
}) {
  const { error } = await supabase
    .from('tasks')
    .update({
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled'
    })
    .eq('id', taskId);

  if (error) throw error;
}