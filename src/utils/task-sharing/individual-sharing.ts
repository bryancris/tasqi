
import { supabase } from "@/integrations/supabase/client";
import { createTaskAssignmentNotification } from "./notifications";
import { TaskData } from "./types";

export async function shareWithIndividuals(
  taskData: TaskData,
  selectedUserIds: string[],
  currentUserId: string,
  initialStatus: string = 'pending'
) {
  // Track individual results
  const results = [];
  
  for (const userId of selectedUserIds) {
    try {
      console.log(`Sharing task ${taskData.id} with user ${userId}`);
      
      // Create shared task record
      const { data: sharedTask, error: shareError } = await supabase
        .from('shared_tasks')
        .insert({
          task_id: taskData.id,
          shared_with_user_id: userId,
          shared_by_user_id: currentUserId,
          sharing_type: 'individual',
          status: initialStatus
        })
        .select()
        .single();

      if (shareError) {
        console.error(`Share task error for user ${userId}:`, shareError);
        results.push(null); // Mark this share as failed
        continue; // Try the next user instead of stopping everything
      }

      // Create task assignment record
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskData.id,
          assignee_id: userId,
          assigned_by_id: currentUserId,
          status: initialStatus
        });

      if (assignmentError) {
        console.error(`Assignment error for user ${userId}:`, assignmentError);
        // Don't fail the whole operation if just the assignment fails
      }

      // Create and show notification
      try {
        await createTaskAssignmentNotification(userId, taskData);
      } catch (notificationError) {
        console.error(`Notification error for user ${userId}:`, notificationError);
        // Continue even if notification fails
      }

      results.push(sharedTask); // Mark this share as successful
    } catch (error) {
      console.error(`Error sharing with user ${userId}:`, error);
      results.push(null); // Mark this share as failed
    }
  }

  return results;
}
