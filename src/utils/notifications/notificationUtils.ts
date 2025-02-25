
import { Task } from "@/components/dashboard/TaskBoard";
import { isNotificationSupported } from "./platformDetection";

// Separate browser notification handling
async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!isNotificationSupported()) {
      console.warn('❌ Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('❌ Notification permission denied by user');
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log('🔔 Notification permission status:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
}

// Play notification sound using both native and custom sound
export const playNotificationSound = async () => {
  try {
    console.log('🔊 Playing notification sound...');
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    await audio.play();
    console.log('✅ Notification sound played successfully');
  } catch (error) {
    console.warn('❌ Could not play notification sound:', error);
  }
};

// Show browser notification
export async function showBrowserNotification(task: Task, type: 'reminder' | 'shared' | 'assignment' = 'reminder'): Promise<boolean> {
  try {
    console.log('🔔 Attempting to show notification for task:', task.id);
    
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.warn('❌ No permission to show notifications');
      return false;
    }

    const notificationTitle = type === 'reminder' ? 'Task Reminder' :
                            type === 'shared' ? 'Task Shared' :
                            'New Task Assignment';

    const notification = new Notification(notificationTitle, {
      body: task.title,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `task-${task.id}`,
      data: { taskId: task.id, type },
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
    });

    notification.onclick = function() {
      console.log('🔔 Notification clicked:', task.id);
      window.focus();
      if (location.pathname !== '/dashboard') {
        window.location.href = '/dashboard';
      }
    };

    console.log('✅ Notification shown successfully');
    return true;
  } catch (error) {
    console.error('❌ Error showing browser notification:', error);
    return false;
  }
}
