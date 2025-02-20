import { Task } from "@/components/dashboard/TaskBoard";
import { detectPlatform, isTwinrEnvironment } from "./platformDetection";

export async function showNotification(task: Task, type: 'reminder' | 'shared' = 'reminder') {
  try {
    console.log('🔔 Showing notification:', {
      taskId: task.id,
      type,
      title: task.title,
      platform: detectPlatform()
    });

    if (isTwinrEnvironment()) {
      // Log Twinr notification attempt
      console.log('📱 Using Twinr notification system');
      // Assuming Twinr has a notification method
      await (window as any).twinr_show_notification({
        title: type === 'reminder' ? 'Task Reminder' : 'Task Shared',
        body: task.title,
        data: { taskId: task.id, type }
      });
      return true;
    }

    // Web notifications
    if (!('Notification' in window)) {
      console.warn('❌ Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification(
        type === 'reminder' ? 'Task Reminder' : 'Task Shared',
        {
          body: task.title,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `task-${task.id}`,
          data: { taskId: task.id, type }
        }
      );

      notification.onclick = function() {
        console.log('🔔 Notification clicked:', task.id);
        window.focus();
        // Add navigation logic here if needed
      };

      return true;
    }

    console.warn('⚠️ Notification permission not granted');
    return false;
  } catch (error) {
    console.error('❌ Error showing notification:', error);
    return false;
  }
}
