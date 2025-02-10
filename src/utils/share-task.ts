
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
    if (sharingType === 'individual') {
      // Create shared task records for each selected user
      const sharedTaskPromises = selectedUserIds.map(userId =>
        supabase
          .from('shared_tasks')
          .upsert({
            task_id: taskId,
            shared_with_user_id: userId,
            shared_by_user_id: currentUserId,
            sharing_type: 'individual'
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
          sharing_type: 'group'
        })
        .select()
        .single();

      if (shareError) {
        console.error('Share with group error:', shareError);
        throw shareError;
      }

      // Show success toast
      toast.success('Task shared with group successfully');

      // Send notification for group share
      await supabase.functions.invoke('send-invitation', {
        body: { sharedTaskId: sharedTask.id }
      });
    }

    // Update the task's shared status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ shared: true })
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
