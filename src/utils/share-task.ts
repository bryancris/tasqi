
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShareTaskParams } from "./task-sharing/types";
import { shareWithIndividuals } from "./task-sharing/individual-sharing";
import { shareWithGroup } from "./task-sharing/group-sharing";

export async function shareTask({
  taskId,
  selectedUserIds,
  selectedGroupId,
  sharingType,
  currentUserId,
}: ShareTaskParams) {
  try {
    // Get the task's current status to preserve it
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('Error fetching task:', taskError);
      throw taskError;
    }

    // Share based on type
    if (sharingType === 'individual') {
      const results = await shareWithIndividuals(taskData, selectedUserIds, currentUserId);
      const errors = results.filter(result => !result);

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
    } else {
      await shareWithGroup(taskData, selectedGroupId, currentUserId);
      toast.success('Task shared with group successfully');
    }

    // Update the task's shared status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        shared: true,
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
