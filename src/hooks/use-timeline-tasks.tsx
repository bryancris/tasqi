
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { toast } from "sonner";

export function useTimelineTasks() {
  const fetchTasks = async () => {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*)
      `)
      .eq('status', 'scheduled')
      .order('position', { ascending: true })
      .abortSignal(AbortSignal.timeout(5000));

    if (tasksError) {
      console.error('Error fetching timeline tasks:', tasksError);
      toast.error("Failed to load timeline tasks");
      throw tasksError;
    }

    return (tasks || []) as Task[];
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ['timeline-tasks'],
    queryFn: fetchTasks,
    staleTime: 300000, // Consider data fresh for 5 minutes
    gcTime: 3600000, // Keep unused data for 1 hour
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  return { tasks };
}
