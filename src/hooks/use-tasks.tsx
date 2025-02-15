
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { startOfDay, endOfDay } from "date-fns";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

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

  // Set up real-time subscription with debouncing
  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;

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
          console.log('Task changed, payload:', payload);
          // Clear any existing timeout
          clearTimeout(debounceTimeout);
          // Set a new timeout to invalidate queries
          debounceTimeout = setTimeout(() => {
            console.log('Invalidating tasks query...');
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }, 100); // Small delay to handle multiple rapid changes
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription and timeout on unmount
    return () => {
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 0, // Consider data immediately stale
    gcTime: 300000, // Keep unused data in cache for 5 minutes
  });

  return { tasks, refetch };
}
