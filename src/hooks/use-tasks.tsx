
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { startOfDay, endOfDay } from "date-fns";

export function useTasks() {
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
    return tasks.filter((task: Task) => {
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

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep unused data in cache for 5 minutes
  });

  return { tasks, refetch };
}
