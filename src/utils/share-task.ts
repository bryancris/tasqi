
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
    console.log('Starting share task process for taskId:', taskId);
    
    // Get the task's current status to preserve it, now selecting all required fields
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, description, status, date, start_time, end_time, priority, position, user_id, owner_id, completed_at')
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

    // Get the current completed status to ensure we share the correct status
    const isCompleted = taskData.status === 'completed';
    const sharedTaskStatus = isCompleted ? 'completed' : 'pending';

    // Ensure the task data has the correct status type
    const validatedTaskData: TaskData = {
      ...taskData,
      status: taskData.status as TaskData['status'],
      priority
    };

    // Share based on type
    let results;
    if (sharingType === 'individual') {
      results = await shareWithIndividuals(validatedTaskData, selectedUserIds, currentUserId, sharedTaskStatus);
      
      // Check for errors, but continue with the successful ones
      const errors = results.filter(result => !result);
      if (errors.length > 0) {
        console.warn('Some individual shares failed:', errors.length, 'out of', selectedUserIds.length);
      }
    } else {
      await shareWithGroup(validatedTaskData, selectedGroupId, currentUserId, sharedTaskStatus);
    }

    // Update the task's shared status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ shared: true })
      .eq('id', taskId);

    if (updateError) {
      console.error('Update task shared status error:', updateError);
      // Don't throw here, as the sharing was already successful
      console.warn('Task sharing completed but failed to update shared flag');
    }
    
    // Return success even if there were some non-critical errors
    return { success: true };
  } catch (error) {
    console.error('Share task error:', error);
    // Re-throw the error so it can be handled by the caller
    throw error;
  }
}
