
import { supabase } from "@/integrations/supabase/client";
import { showNotification } from "@/utils/notifications/notificationUtils";
import { useNotificationSound } from "@/components/dashboard/header/notifications/useNotificationSound";
import { TaskData } from "./types";

export async function createTaskAssignmentNotification(
  userId: string,
  taskData: TaskData,
  isGroup: boolean = false
) {
  const { playNotificationSound } = useNotificationSound();

  // Create notification record
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: isGroup ? 'New Group Task Assignment' : 'New Task Assignment',
      message: `${isGroup ? 'A new task has been shared with your group' : 'You have been assigned to'}: ${taskData.title}`,
      type: 'task_assignment',
      reference_id: taskData.id.toString(),
      reference_type: 'task'
    });

  if (notificationError) {
    console.error('Error creating notification:', notificationError);
    throw notificationError;
  }

  // Show notification and play sound
  try {
    await showNotification(taskData, 'assignment');
    await playNotificationSound();
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}
