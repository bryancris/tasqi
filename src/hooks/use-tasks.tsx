
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { toast } from "sonner";
import { startOfDay, endOfDay, isToday, parseISO } from "date-fns";

export function useTasks() {
  const fetchTasks = async () => {
    console.log('Fetching tasks...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*),
        task_attachments(*),
        shared_tasks(*)
      `)
      .order('position', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      toast.error("Failed to load tasks");
      throw tasksError;
    }

    console.log('Tasks fetched:', tasks);
    return (tasks || []) as Task[];
  };

  const { data: tasks = [], refetch, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  return { tasks, refetch, isLoading };
}
