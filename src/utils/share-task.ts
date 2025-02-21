
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShareTaskParams, TaskData, TaskPriority } from "./task-sharing/types";
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
    // Get the task's current status to preserve it, now selecting all required fields
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, description, status, date, start_time, end_time, priority, position, user_id, owner_id')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('Error fetching task:', taskError);
      throw taskError;
    }

    // Validate task priority
    const priority = taskData.priority as TaskPriority | null;
    if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
      console.warn('Invalid priority value:', taskData.priority);
    }

    // Ensure the task data has the correct status type
    const validatedTaskData: TaskData = {
      ...taskData,
      status: taskData.status as TaskData['status'],
      priority
    };

    // Share based on type
    if (sharingType === 'individual') {
      const results = await shareWithIndividuals(validatedTaskData, selectedUserIds, currentUserId);
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
      await shareWithGroup(validatedTaskData, selectedGroupId, currentUserId);
      toast.success('Task shared with group successfully');
    }

    // Update the task's shared status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        shared: true,
        status: validatedTaskData.status,
        date: validatedTaskData.date,
        start_time: validatedTaskData.start_time,
        end_time: validatedTaskData.end_time,
        priority: validatedTaskData.priority
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
