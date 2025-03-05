
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task } from "../TaskBoard";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncedTaskRefresh } from "@/hooks/use-debounced-task-refresh";

export function useTaskStatus(task: Task) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { invalidateTasks } = useDebouncedTaskRefresh();
  
  // Enhanced optimistic update helper with proper status handling
  const updateOptimisticTask = (taskId: number, newStatus: 'completed' | 'unscheduled') => {
    // Update the task in the QueryClient cache immediately for UI responsiveness
    queryClient.setQueryData(['tasks'], (oldData: Task[] | undefined) => {
      if (!oldData) return undefined;
      
      return oldData.map(t => {
        if (t.id === taskId) {
          console.log(`Optimistically updating task ${taskId} to status: ${newStatus}`);
          // Create optimistic update with ALL required properties
          return {
            ...t,
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : null
          };
        }
        return t;
      });
    });
  };

  const handleComplete = async () => {
    try {
      console.log('Attempting to complete task:', task.id);
      if (isUpdating) {
        console.log('Task update already in progress, skipping...');
        return false;
      }
      
      setIsUpdating(true);
      console.log('Current task status:', task.status);
      
      const newStatus = task.status === 'completed' ? 'unscheduled' : 'completed';
      const completedAt = task.status === 'completed' ? null : new Date().toISOString();
      
      console.log('Updating task to:', { newStatus, completedAt });
      
      // Apply enhanced optimistic update immediately for better UX
      updateOptimisticTask(task.id, newStatus);

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('User not authenticated');
        setIsUpdating(false);
        return false;
      }
      
      const userId = userData.user.id;

      let updateSuccess = false;
      
      if (task.shared) {
        console.log('Handling shared task completion:', task.title, task);
        console.log('User ID:', userId);
        
        // First, find the correct shared task record for this user
        const userSharedTask = task.shared_tasks?.find(
          st => st.shared_with_user_id === userId
        );
        
        if (userSharedTask) {
          console.log('Found shared task record:', userSharedTask);
          
          // Update the shared task status
          const { error: sharedUpdateError } = await supabase
            .from('shared_tasks')
            .update({ 
              status: newStatus === 'completed' ? 'completed' : 'pending'
            })
            .eq('id', userSharedTask.id);

          if (sharedUpdateError) {
            console.error('Error updating shared task:', sharedUpdateError);
            toast.error('Failed to update shared task status');
          } else {
            updateSuccess = true;
            console.log('Shared task status updated successfully');
            
            // Force a longer delay before refreshing to ensure the database trigger has time to process
            setTimeout(() => {
              invalidateTasks(0); // Immediate refresh after delay
            }, 500);
          }
        } else {
          // In case we don't find a specific shared task (as fallback)
          console.log('No specific shared task found, using task_id fallback');
          
          // Try to find any shared task for this user and task
          const { data: sharedTasks, error: fetchError } = await supabase
            .from('shared_tasks')
            .select('*')
            .eq('task_id', task.id)
            .eq('shared_with_user_id', userId);
            
          if (fetchError) {
            console.error('Error fetching shared tasks:', fetchError);
          } else if (sharedTasks && sharedTasks.length > 0) {
            console.log('Found shared tasks through query:', sharedTasks);
            
            // Update the first found shared task
            const { error: fallbackError } = await supabase
              .from('shared_tasks')
              .update({ 
                status: newStatus === 'completed' ? 'completed' : 'pending'
              })
              .eq('id', sharedTasks[0].id);
              
            if (fallbackError) {
              console.error('Error with fallback shared task update:', fallbackError);
              toast.error('Failed to update task status');
            } else {
              updateSuccess = true;
              console.log('Task updated with fallback method');
              
              // Force a longer delay before refreshing
              setTimeout(() => {
                invalidateTasks(0);
              }, 500);
            }
          } else {
            console.error('No shared tasks found for this user and task');
            toast.error('Failed to find shared task record');
          }
        }
      } else {
        console.log('Updating owned task');
        // Update the main task record directly for tasks the user owns
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: newStatus,
            completed_at: completedAt
          })
          .eq('id', task.id);

        if (updateError) {
          console.error('Error updating task:', updateError);
          toast.error('Failed to update task status');
        } else {
          updateSuccess = true;
          console.log('Task updated successfully');
          invalidateTasks(100);
        }
      }

      if (updateSuccess) {
        toast.success(newStatus === 'completed' ? 'Task completed' : 'Task uncompleted');
      }

      return updateSuccess;
    } catch (error: any) {
      console.error('Unexpected error completing task:', error);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    handleComplete
  };
}
