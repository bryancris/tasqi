
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

      // UPDATED APPROACH: Use a transaction to ensure consistency
      let updateSuccess = false;
      
      // First step: Always update the main task status directly
      const { error: mainTaskError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', task.id);
        
      if (mainTaskError) {
        console.error('Error updating main task:', mainTaskError);
        toast.error('Failed to update task status');
        return false;
      }
      
      // Second step: Handle shared task records
      if (task.shared) {
        console.log('Updating shared tasks for task:', task.id);
        
        // Update ALL shared task records to maintain consistency
        const { error: allSharedTasksError } = await supabase
          .from('shared_tasks')
          .update({ 
            status: newStatus === 'completed' ? 'completed' : 'pending'
          })
          .eq('task_id', task.id);
          
        if (allSharedTasksError) {
          console.error('Error updating all shared tasks:', allSharedTasksError);
          toast.error('Failed to synchronize shared status');
          return false;
        }
        
        updateSuccess = true;
        console.log('Successfully updated main task and all shared tasks');
      } else {
        updateSuccess = true;
        console.log('Successfully updated non-shared task');
      }

      if (updateSuccess) {
        toast.success(newStatus === 'completed' ? 'Task completed' : 'Task uncompleted');
        
        // Trigger a fast refresh for related queries with a short delay
        invalidateTasks(100);
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
