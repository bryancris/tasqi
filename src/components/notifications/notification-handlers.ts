
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QueryClient } from "@tanstack/react-query";
import { isTestNotification } from "@/utils/notifications/debug-utils";

export const handleStart = async (
  referenceId: number | string,
  queryClient: QueryClient,
  onDismiss: () => void
) => {
  try {
    // Extra validation for test notification
    if (isTestNotification(referenceId)) {
      console.log('✅ Test task processing completed');
      toast.success('Test task completed');
      onDismiss();
      return;
    }
    
    // Always convert referenceId to number
    const taskId = typeof referenceId === 'string' ? parseInt(referenceId, 10) : referenceId;
    
    console.log('🚀 Processing task with ID:', taskId, 'Type:', typeof taskId, 'Original:', referenceId);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    // Determine if this is a shared task
    const { data: sharedTask } = await supabase
      .from('shared_tasks')
      .select('*')
      .eq('task_id', taskId)
      .eq('shared_with_user_id', user.id)
      .single();

    if (sharedTask) {
      // Update shared task status
      const { error } = await supabase
        .from('shared_tasks')
        .update({ status: 'completed' })
        .eq('task_id', taskId)
        .eq('shared_with_user_id', user.id);

      if (error) {
        console.error('Error completing shared task:', error);
        toast.error('Failed to complete task');
        return;
      }
    } else {
      // Update regular task status
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error completing task:', error);
        toast.error('Failed to complete task');
        return;
      }
    }

    toast.success('Task completed');
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    onDismiss();
  } catch (error) {
    console.error('Unexpected error completing task:', error);
    toast.error('An unexpected error occurred');
  }
};

export const handleSnooze = async (
  referenceId: number | string,
  minutes: number,
  queryClient: QueryClient,
  onDismiss: () => void
) => {
  try {
    // Extra validation for test notification
    if (isTestNotification(referenceId)) {
      console.log('✅ Test task snooze completed for', minutes, 'minutes');
      toast.success(`Task snoozed for ${minutes} minutes`);
      onDismiss();
      return;
    }
    
    // Always convert referenceId to number
    const taskId = typeof referenceId === 'string' ? parseInt(referenceId, 10) : referenceId;
    
    console.log('⏰ Snoozing task with ID:', taskId, 'Type:', typeof taskId, 'for', minutes, 'minutes');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    // Calculate new reminder time based on minutes
    let reminderMessage = '';
    if (minutes === 24 * 60) {
      // If it's "tomorrow", set to 9 AM tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      reminderMessage = 'tomorrow at 9:00 AM';
    } else if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      reminderMessage = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      reminderMessage = `${minutes} minutes`;
    }

    // Determine if this is a shared task
    const { data: sharedTask } = await supabase
      .from('shared_tasks')
      .select('*')
      .eq('task_id', taskId)
      .eq('shared_with_user_id', user.id)
      .single();

    if (sharedTask) {
      // For shared tasks, we might handle this differently
      toast.info(`Reminder snoozed for ${reminderMessage}`);
    } else {
      // Update using the proper field name based on the database schema
      const { error } = await supabase
        .from('tasks')
        .update({ 
          reminder_time: minutes,
          reminder_enabled: true
        })
        .eq('id', taskId);

      if (error) {
        console.error('Error snoozing task:', error);
        toast.error('Failed to snooze reminder');
        return;
      }
    }

    toast.success(`Reminder snoozed for ${reminderMessage}`);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    onDismiss();
  } catch (error) {
    console.error('Unexpected error snoozing task:', error);
    toast.error('An unexpected error occurred');
  }
};
