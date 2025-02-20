
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { startOfDay, endOfDay, isToday, parseISO } from "date-fns";
import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useTasks() {
  const queryClient = useQueryClient();

  const fetchTasks = async () => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    console.log('Fetching tasks for today:', today.toISOString());

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*)
      `)
      .order('position', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      toast.error("Failed to load tasks");
      throw tasksError;
    }

    // Filter tasks for TaskBoard:
    // 1. All unscheduled tasks
    // 2. Today's scheduled tasks
    // 3. Today's completed tasks
    return (tasks || []).filter((task) => {
      // Always show unscheduled tasks
      if (task.status === 'unscheduled') {
        return true;
      }

      const taskDate = task.date ? parseISO(task.date) : null;
      
      // Only show scheduled tasks for today
      if (task.status === 'scheduled' && taskDate) {
        return isToday(taskDate);
      }
      
      // Only show tasks completed today
      if (task.status === 'completed') {
        return task.completed_at && 
               new Date(task.completed_at) >= todayStart && 
               new Date(task.completed_at) <= todayEnd;
      }
      
      return false;
    }) as Task[];
  };

  const invalidateTasksQuery = useCallback(() => {
    console.log('Invalidating tasks query...');
    void queryClient.invalidateQueries({ 
      queryKey: ['tasks'],
      exact: true,
      refetchType: 'active'
    });
    // Also invalidate timeline tasks
    void queryClient.invalidateQueries({ 
      queryKey: ['timeline-tasks'],
      exact: true,
      refetchType: 'active'
    });
  }, [queryClient]);

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription...');
    let isSubscribed = true;

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
          if (isSubscribed) {
            invalidateTasksQuery();
          }
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
          if (isSubscribed) {
            invalidateTasksQuery();
          }
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
          if (isSubscribed) {
            invalidateTasksQuery();
          }
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
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [invalidateTasksQuery]);

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { tasks, refetch };
}
