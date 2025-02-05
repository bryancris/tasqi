import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { DragEndEvent } from "@dnd-kit/core";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useWeeklyCalendar(weekStart: Date, weekEnd: Date, weekDays: Date[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Task[];
    },
  });

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
          queryClient.invalidateQueries({ 
            queryKey: ['tasks', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, weekStart, weekEnd]);

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
        const dropData = (over.data?.current as { date: string; hour: number }) || null;
        if (!dropData) {
          console.error('Missing drop data');
          return;
        }

        const { date, hour } = dropData;
        console.log('Processing drop:', { date, hour });
        
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
        
        await updateTaskTime({
          taskId,
          dateStr: date,
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

  const scheduledTasks = tasks.filter(task => task.status === 'scheduled' && task.date && task.start_time);
  const unscheduledTasks = tasks.filter(task => task.status === 'unscheduled');

  const visitsPerDay = weekDays.map(day => {
    const dayTasks = scheduledTasks.filter(task => {
      if (!task.date) return false;
      const taskDate = format(new Date(task.date), 'yyyy-MM-dd');
      return taskDate === format(day, 'yyyy-MM-dd');
    });
    return `${dayTasks.length} ${dayTasks.length === 1 ? 'Visit' : 'Visits'}`;
  });

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
  taskId: number;
  dateStr: string;
  startTime: string;
  endTime: string;
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