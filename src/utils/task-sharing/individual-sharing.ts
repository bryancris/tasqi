
import { supabase } from "@/integrations/supabase/client";
import { createTaskAssignmentNotification } from "./notifications";
import { TaskData } from "./types";

export async function shareWithIndividuals(
  taskData: TaskData,
  selectedUserIds: string[],
  currentUserId: string
) {
  const promises = selectedUserIds.map(async (userId) => {
    // Create shared task record
    const { data: sharedTask, error: shareError } = await supabase
      .from('shared_tasks')
      .insert({
        task_id: taskData.id,
        shared_with_user_id: userId,
        shared_by_user_id: currentUserId,
        sharing_type: 'individual',
        status: taskData.status === 'completed' ? 'completed' : 'pending'
      })
      .select()
      .single();

    if (shareError) {
      console.error('Share task error:', shareError);
      throw shareError;
    }

    // Create task assignment record
    const { error: assignmentError } = await supabase
      .from('task_assignments')
      .insert({
        task_id: taskData.id,
        assignee_id: userId,
        assigned_by_id: currentUserId,
        status: taskData.status === 'completed' ? 'completed' : 'pending'
      });

    if (assignmentError) {
      console.error('Assignment error:', assignmentError);
      throw assignmentError;
    }

    // Create and show notification
    await createTaskAssignmentNotification(userId, taskData);

    return sharedTask;
  });

  return Promise.all(promises);
}
