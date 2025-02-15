
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { startOfDay, endOfDay } from "date-fns";

export function useTasks() {
  const fetchTasks = async () => {
    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const todayEnd = endOfDay(today).toISOString();

    // First fetch tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*)
      `)
      .or(`status.eq.unscheduled,and(status.eq.scheduled,date.eq.${today.toISOString().split('T')[0]})`)
      .order('position', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    return tasks as Task[];
  };

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep unused data in cache for 5 minutes
  });

  return { tasks, refetch };
}
