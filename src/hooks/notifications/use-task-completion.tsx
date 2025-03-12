
import { Task } from '@/components/dashboard/TaskBoard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useTaskCompletion() {
  const queryClient = useQueryClient();

  const handleTaskComplete = useCallback(async (task: Task) => {
    try {
      // For test notifications, just dismiss them
      // Convert to string for comparison to avoid type errors
      if (String(task.id) === "999999") {
        toast.success('Test task completed');
        return;
      }
      
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      if (task.shared) {
        const { error: sharedUpdateError } = await supabase
          .from('shared_tasks')
          .update({ status: 'completed' })
          .eq('task_id', task.id)
          .eq('shared_with_user_id', user.id);

        if (sharedUpdateError) {
          console.error('Error completing shared task:', sharedUpdateError);
          toast.error('Failed to complete task');
          return;
        }
      } else {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (updateError) {
          console.error('Error completing task:', updateError);
          toast.error('Failed to complete task');
          return;
        }
      }

      toast.success('Task completed');
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Unexpected error completing task:', error);
      toast.error('An unexpected error occurred');
    }
  }, [queryClient]);

  return { handleTaskComplete };
}
