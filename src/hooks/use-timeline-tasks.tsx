
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";

export function useTimelineTasks() {
  const fetchTasks = async () => {
    // Fetch all scheduled tasks for timeline view
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*)
      `)
      .eq('status', 'scheduled')
      .order('position', { ascending: true });

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
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  return { tasks };
}
