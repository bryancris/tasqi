
import { supabase } from "@/integrations/supabase/client";
import { TaskData } from "./types";

export async function createTaskAssignmentNotification(
  userId: string,
  taskData: TaskData,
  isGroup: boolean = false
) {
  // Create notification record
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: isGroup ? 'New Group Task Assignment' : 'New Task Assignment',
      message: `${isGroup ? 'A new task has been shared with your group' : 'You have been assigned to'}: ${taskData.title}`,
      type: 'task_assignment',
      referenceId: taskData.id.toString(), // Updated to camelCase
      referenceType: 'task' // Updated to camelCase
    });

  if (notificationError) {
    console.error('Error creating notification:', notificationError);
    throw notificationError;
  }
}
