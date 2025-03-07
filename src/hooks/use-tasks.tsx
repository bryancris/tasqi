
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
    if (userError) {
      console.error('Error getting user data:', userError);
      throw userError;
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      console.error('No user ID available');
      throw new Error('User not authenticated');
    }
    
    // First get tasks owned by user with explicit inclusion of shared_tasks
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

    console.log('Fetched owned tasks:', ownedTasks?.length || 0);
    
    // Then get tasks shared with the user - fetch fully joined data
    const { data: sharedWithUserTasks, error: sharedTasksError } = await supabase
      .from('shared_tasks')
      .select(`
        *,
        task:tasks(
          *,
          assignments:task_assignments(*),
          task_attachments(*),
          shared_tasks(*)
        )
      `)
      .eq('shared_with_user_id', userId);

    if (sharedTasksError) {
      console.error('Error fetching shared tasks:', sharedTasksError);
      toast.error("Failed to load shared tasks");
      throw sharedTasksError;
    }

    console.log('Fetched shared tasks:', sharedWithUserTasks?.length || 0);
    
    // Process shared tasks to match the Task interface
    const processedSharedTasks = sharedWithUserTasks
      .filter(st => st.task) // Filter out null tasks
      .map(sharedTask => {
        const task = sharedTask.task;
        
        // IMPORTANT: For shared tasks, we need to determine the status from the shared_task record
        // This is the source of truth for this user's view of the task
        let effectiveStatus: Task['status'];
        
        // Use the shared_task status as the source of truth
        if (sharedTask.status === 'completed') {
          effectiveStatus = 'completed';
        } else {
          // If not completed, use the appropriate scheduled/unscheduled status
          effectiveStatus = task.date ? 'scheduled' : 'unscheduled';
        }
        
        // Ensure all required properties have default values
        const processedTask = {
          ...task,
          // Required properties with defaults
          assignees: task.assignees || [],
          completed_at: effectiveStatus === 'completed' ? (task.completed_at || new Date().toISOString()) : null,
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
          // Set shared flag
          shared: true,
          // Use the effective status based on shared_task status
          status: effectiveStatus,
          // Ensure shared_tasks is an array containing at least this sharing reference
          shared_tasks: task.shared_tasks && task.shared_tasks.length > 0 
            ? task.shared_tasks 
            : [sharedTask]
        };

        return processedTask as Task;
      });

    // Process owned tasks to ensure they have all required properties
    const processedOwnedTasks = (ownedTasks || []).map(task => {
      // Ensure shared_tasks is always an array
      if (task.shared && (!task.shared_tasks || !Array.isArray(task.shared_tasks))) {
        console.warn(`Task ${task.id} is marked as shared but has no shared_tasks array`);
      }
      
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
        shared_tasks: Array.isArray(task.shared_tasks) ? task.shared_tasks : [] // Ensure shared_tasks is always an array
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

    console.log('Total tasks after processing:', allTasks.length);
    
    return allTasks as Task[];
  };

  const { data: tasks = [], refetch, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    // Improved settings for faster updates
    staleTime: 0, // Consider data always stale to ensure it's refreshed
    gcTime: 5 * 60 * 1000, // Keep unused data for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  return { tasks, refetch, isLoading };
}
