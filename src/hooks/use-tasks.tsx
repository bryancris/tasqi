
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { toast } from "sonner";
import { startOfDay, endOfDay, isToday, parseISO } from "date-fns";

export function useTasks() {
  const fetchTasks = async () => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*)
      `)
      .order('position', { ascending: true })
      .abortSignal(AbortSignal.timeout(5000)); // Add timeout to prevent hanging requests

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
    queryKey: ['tasks', startOfDay(new Date()).toISOString()], // Add date to queryKey
    queryFn: fetchTasks,
    staleTime: 300000, // Consider data fresh for 5 minutes
    gcTime: 3600000, // Keep unused data for 1 hour
    refetchOnWindowFocus: true, // Only refetch when window regains focus
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1, // Only retry once on failure
  });

  return { tasks, refetch };
}
