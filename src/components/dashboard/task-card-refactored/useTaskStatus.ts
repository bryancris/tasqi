
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task } from "../TaskBoard";
import { useQueryClient } from "@tanstack/react-query";

export function useTaskStatus(task: Task) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleComplete = async () => {
    try {
      console.log('Attempting to complete task:', task.id);
      if (isUpdating) {
        console.log('Task update already in progress, skipping...');
        return;
      }
      
      setIsUpdating(true);
      console.log('Current task status:', task.status);
      
      const newStatus = task.status === 'completed' ? 'unscheduled' : 'completed';
      const completedAt = task.status === 'completed' ? null : new Date().toISOString();
      
      console.log('Updating task to:', { newStatus, completedAt });

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast.error('User not authenticated');
        setIsUpdating(false);
        return;
      }
      
      const userId = userData.user.id;

      let updateSuccess = false;
      
      if (task.shared) {
        console.log('Checking shared task info for task:', task.title, task);
        console.log('Using shared_tasks from task object:', task.shared_tasks);
        
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
            .eq('id', userSharedTask.id)
            .eq('shared_with_user_id', userId);

          if (sharedUpdateError) {
            console.error('Error updating shared task:', sharedUpdateError);
            toast.error('Failed to update shared task status');
          } else {
            updateSuccess = true;
            console.log('Shared task updated successfully');
          }
        } else {
          // In case we don't find a specific shared task (as fallback)
          console.log('No specific shared task found, using task_id fallback');
          
          const { error: fallbackError } = await supabase
            .from('shared_tasks')
            .update({ 
              status: newStatus === 'completed' ? 'completed' : 'pending'
            })
            .eq('task_id', task.id)
            .eq('shared_with_user_id', userId);
            
          if (fallbackError) {
            console.error('Error with fallback shared task update:', fallbackError);
            toast.error('Failed to update task status');
          } else {
            updateSuccess = true;
            console.log('Task updated with fallback method');
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
        }
      }

      if (updateSuccess) {
        toast.success(newStatus === 'completed' ? 'Task completed' : 'Task uncompleted');
        
        // Add a small delay to allow triggers to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force invalidate and refetch tasks to ensure UI consistency
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
