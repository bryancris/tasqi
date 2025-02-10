
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareTaskParams {
  taskId: number;
  selectedUserIds: string[];
  selectedGroupId: string;
  sharingType: "individual" | "group";
  currentUserId: string;
}

export async function shareTask({
  taskId,
  selectedUserIds,
  selectedGroupId,
  sharingType,
  currentUserId,
}: ShareTaskParams) {
  try {
    // First get the task's current status to preserve it
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('Error fetching task:', taskError);
      throw taskError;
    }

    if (sharingType === 'individual') {
      // Create shared task records for each selected user
      const sharedTaskPromises = selectedUserIds.map(userId =>
        supabase
          .from('shared_tasks')
          .upsert({
            task_id: taskId,
            shared_with_user_id: userId,
            shared_by_user_id: currentUserId,
            sharing_type: 'individual',
            // Preserve the task's status
            status: taskData.status === 'completed' ? 'completed' : 'pending'
          })
          .select()
          .single()
      );

      const results = await Promise.all(sharedTaskPromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.error('Share task errors:', errors);
        throw new Error('Failed to share task with some users');
      }

      // Show success toast
      if (selectedUserIds.length === 1) {
        toast.success('Task shared successfully');
      } else {
        toast.success(`Task shared with ${selectedUserIds.length} users`);
      }

      // Play notification sound
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(console.error);

      // Send notifications for each shared task
      await Promise.all(
        results.map(result => {
          if (result.data) {
            return supabase.functions.invoke('send-invitation', {
              body: { sharedTaskId: result.data.id }
            });
          }
          return Promise.resolve();
        })
      );
    } else {
      // Share with group
      const { data: sharedTask, error: shareError } = await supabase
        .from('shared_tasks')
        .upsert({
          task_id: taskId,
          group_id: parseInt(selectedGroupId),
          shared_by_user_id: currentUserId,
          sharing_type: 'group',
          // Preserve the task's status
          status: taskData.status === 'completed' ? 'completed' : 'pending'
        })
        .select()
        .single();

      if (shareError) {
        console.error('Share with group error:', shareError);
        throw shareError;
      }

      // Show success toast and play sound
      toast.success('Task shared with group successfully');
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(console.error);

      // Send notification for group share
      await supabase.functions.invoke('send-invitation', {
        body: { sharedTaskId: sharedTask.id }
      });
    }

    // Update the task's shared status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        shared: true,
        // Ensure we preserve the original status and scheduling
        status: taskData.status,
        date: taskData.date,
        start_time: taskData.start_time,
        end_time: taskData.end_time,
        priority: taskData.priority
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Update task shared status error:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Share task error:', error);
    toast.error('Failed to share task. Please try again.');
    throw error;
  }
}
