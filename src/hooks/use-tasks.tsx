
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { startOfDay, endOfDay } from "date-fns";
import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useTasks() {
  const queryClient = useQueryClient();

  const fetchTasks = async () => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todayDate = today.toISOString().split('T')[0];

    // Fetch tasks for today and unscheduled tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*)
      `)
      .or(`status.eq.unscheduled,and(status.eq.scheduled,date.eq.${todayDate})`)
      .order('position', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      toast.error("Failed to load tasks");
      throw tasksError;
    }

    // Filter completed tasks to only show today's completed tasks
    return (tasks || []).filter((task) => {
      if (task.status === 'completed') {
        return task.completed_at && 
               new Date(task.completed_at) >= todayStart && 
               new Date(task.completed_at) <= todayEnd;
      }
      
      if (task.status === 'scheduled') {
        return task.date === todayDate;
      }
      
      // Always show unscheduled tasks
      return task.status === 'unscheduled';
    }) as Task[];
  };

  const invalidateTasksQuery = useCallback(() => {
    console.log('Invalidating tasks query...');
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription...');

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task changed:', payload);
          invalidateTasksQuery();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignments'
        },
        (payload) => {
          console.log('Task assignment changed:', payload);
          invalidateTasksQuery();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subtasks'
        },
        (payload) => {
          console.log('Subtask changed:', payload);
          invalidateTasksQuery();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time changes');
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [invalidateTasksQuery]);

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 0, // Consider data immediately stale
    gcTime: 300000, // Keep unused data in cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  return { tasks, refetch };
}
