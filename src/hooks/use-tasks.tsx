
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { startOfDay, endOfDay, isToday, parseISO } from "date-fns";
import { useCallback } from "react";
import { toast } from "sonner";

export function useTasks() {
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

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 5000, // Only refetch after 5 seconds
    gcTime: 300000, // Keep unused data for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: false, // Don't refetch on interval
  });

  const memoizedRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  return { tasks, refetch: memoizedRefetch };
}
