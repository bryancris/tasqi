
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
        assignments:task_assignments(*)
      `)
      .order('position', { ascending: true })
      .abortSignal(AbortSignal.timeout(5000));

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      toast.error("Failed to load tasks");
      throw tasksError;
    }

    console.log('Tasks fetched:', tasks);
    return (tasks || []) as Task[];
  };

  const { data: tasks = [], refetch, isLoading } = useQuery({
    queryKey: ['tasks', startOfDay(new Date()).toISOString()],
    queryFn: fetchTasks,
    staleTime: 300000,
    gcTime: 3600000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  return { tasks, refetch, isLoading };
}
