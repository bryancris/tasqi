
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { toast } from "sonner";
import { startOfDay, endOfDay, isToday, parseISO } from "date-fns";

export function useTasks() {
  const fetchTasks = async () => {
    console.log('Fetching tasks...');
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const userId = userData.user?.id;
    
    // First get tasks owned by user
    const { data: ownedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignments:task_assignments(*),
        task_attachments(*),
        shared_tasks(*)
      `)
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (tasksError) {
      console.error('Error fetching owned tasks:', tasksError);
      toast.error("Failed to load tasks");
      throw tasksError;
    }

    // Then get tasks shared with the user
    const { data: sharedWithUserTasks, error: sharedTasksError } = await supabase
      .from('shared_tasks')
      .select(`
        *,
        task:tasks(
          *,
          assignments:task_assignments(*),
          task_attachments(*)
        )
      `)
      .eq('shared_with_user_id', userId);

    if (sharedTasksError) {
      console.error('Error fetching shared tasks:', sharedTasksError);
      toast.error("Failed to load shared tasks");
      throw sharedTasksError;
    }

    // Process shared tasks to match the Task interface
    const processedSharedTasks = sharedWithUserTasks
      .filter(st => st.task) // Filter out null tasks
      .map(sharedTask => {
        const task = sharedTask.task;
        return {
          ...task,
          shared: true,
          // Use the status from shared_tasks for shared tasks since that's the authoritative status for this user
          status: sharedTask.status === 'completed' ? 'completed' : 
                  (task.date ? 'scheduled' : 'unscheduled'),
          completed_at: sharedTask.status === 'completed' ? new Date().toISOString() : null,
          // Include the shared_tasks record for reference
          shared_tasks: [sharedTask]
        } as Task;
      });

    // Combine owned and shared tasks, ensuring no duplicates
    const allTasks = [...(ownedTasks || [])];
    
    // Only add shared tasks that aren't already in the owned tasks
    processedSharedTasks.forEach(sharedTask => {
      if (!allTasks.some(task => task.id === sharedTask.id)) {
        allTasks.push(sharedTask);
      }
    });

    console.log('Tasks fetched:', allTasks.length);
    return allTasks as Task[];
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
