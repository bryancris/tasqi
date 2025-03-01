
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
        
        // Ensure all required properties have default values
        const processedTask = {
          ...task,
          // Required properties with defaults
          assignees: task.assignees || [],
          completed_at: task.completed_at || null,
          created_at: task.created_at || new Date().toISOString(),
          date: task.date || null,
          description: task.description || null,
          end_time: task.end_time || null,
          owner_id: task.owner_id || task.user_id,
          position: task.position || 0,
          priority: task.priority || 'low',
          is_tracking: task.is_tracking || false,
          reschedule_count: task.reschedule_count || 0,
          reminder_enabled: task.reminder_enabled || false,
          reminder_time: task.reminder_time || 15,
          start_time: task.start_time || null,
          time_spent: task.time_spent || 0,
          updated_at: task.updated_at || new Date().toISOString(),
          // Custom property for shared tasks
          shared: true,
          // Use the status from shared_tasks for shared tasks since that's the authoritative status for this user
          status: sharedTask.status === 'completed' ? 'completed' : 
                  (task.date ? 'scheduled' : 'unscheduled'),
          // Include the shared_tasks record for reference
          shared_tasks: [sharedTask]
        };

        return processedTask as Task;
      });

    // Process owned tasks to ensure they have all required properties
    const processedOwnedTasks = (ownedTasks || []).map(task => {
      // Ensure all required properties have default values for owned tasks as well
      return {
        ...task,
        // Required properties with defaults
        assignees: task.assignees || [],
        completed_at: task.completed_at || null,
        created_at: task.created_at || new Date().toISOString(),
        date: task.date || null,
        description: task.description || null,
        end_time: task.end_time || null,
        owner_id: task.owner_id || task.user_id,
        position: task.position || 0,
        priority: task.priority || 'low',
        is_tracking: task.is_tracking || false,
        reschedule_count: task.reschedule_count || 0,
        reminder_enabled: task.reminder_enabled || false,
        reminder_time: task.reminder_time || 15,
        start_time: task.start_time || null,
        time_spent: task.time_spent || 0,
        updated_at: task.updated_at || new Date().toISOString(),
        shared_tasks: task.shared_tasks || [] // Ensure shared_tasks is always defined
      } as Task;
    });

    // Combine owned and shared tasks, ensuring no duplicates
    const allTasks = [...processedOwnedTasks];
    
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
    staleTime: 60 * 1000, // Consider data stale after 1 minute instead of immediately
    gcTime: 5 * 60 * 1000, // Keep unused data for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: 'always', // Only 'always' for the initial mount
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1,
  });

  return { tasks, refetch, isLoading };
}
