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

    // Format snooze message for toast
    let reminderMessage = '';
    let snoozeDate: Date | null = null;
    let snoozeTime: string | null = null;
    
    // Calculate the new reminder time
    const now = new Date();
    
    if (minutes === 24 * 60) {
      // If it's "tomorrow", set to 9 AM tomorrow
      snoozeDate = new Date(now);
      snoozeDate.setDate(snoozeDate.getDate() + 1);
      snoozeDate.setHours(9, 0, 0, 0);
      
      // Format date as YYYY-MM-DD
      const dateStr = snoozeDate.toISOString().split('T')[0];
      snoozeTime = '09:00:00';
      
      reminderMessage = 'tomorrow at 9:00 AM';
    } else {
      // Calculate the new snooze time by adding minutes
      snoozeDate = new Date(now.getTime() + minutes * 60000);
      
      // Format time as HH:MM:SS
      const hours = snoozeDate.getHours().toString().padStart(2, '0');
      const mins = snoozeDate.getMinutes().toString().padStart(2, '0');
      snoozeTime = `${hours}:${mins}:00`;
      
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        reminderMessage = `${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        reminderMessage = `${minutes} minutes`;
      }
    }
    
    // Get task details to include in notification
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('title, description, date, start_time, end_time')
      .eq('id', taskId)
      .single();
      
    if (taskError) {
      console.error('Error fetching task data:', taskError);
      toast.error('Failed to snooze task: could not fetch task data');
      return;
    }

    const formattedDate = snoozeDate.toISOString().split('T')[0];
    
    // Create a new notification event for the snoozed task
    const { error: notificationError } = await supabase
      .from('notification_events')
      .insert({
        event_type: 'task_reminder',
        user_id: user.id,
        task_id: taskId,
        metadata: {
          title: taskData.title,
          message: `Reminder for: ${taskData.title}`,
          date: formattedDate,
          start_time: snoozeTime,
          end_time: taskData.end_time,
          snoozed: true,
          snoozed_at: now.toISOString(),
          snooze_minutes: minutes,
          reminder_time: '0' // Set to "At start time" for snoozed notifications
        },
        status: 'pending'
      });
    
    if (notificationError) {
      console.error('Error creating snoozed notification:', notificationError);
      toast.error('Failed to schedule snoozed reminder');
      return;
    }

    // Update task status to keep the same reminder_time value
    // This prevents changing the original reminder preferences
    const { error } = await supabase
      .from('tasks')
      .update({ 
        reminder_enabled: true
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task reminder status:', error);
      toast.error('Failed to snooze reminder');
      return;
    }

    toast.success(`Reminder snoozed for ${reminderMessage}`);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    onDismiss();
  } catch (error) {
    console.error('Unexpected error snoozing task:', error);
    toast.error('An unexpected error occurred');
  }
};
