
import { Task } from "@/components/dashboard/TaskBoard";
import { isNotificationSupported } from "./platformDetection";
import { useNotifications } from "@/components/notifications/NotificationsManager";

async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!isNotificationSupported()) {
      console.warn('❌ Notifications not supported in this browser');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('❌ Notification permission denied');
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
const playNotificationSound = async () => {
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

export async function showNotification(task: Task, type: 'reminder' | 'shared' | 'assignment' = 'reminder'): Promise<boolean> {
  try {
    console.log('🔔 Showing notification:', {
      taskId: task.id,
      type,
      title: task.title
    });

    // Get notification title based on type
    const notificationTitle = type === 'reminder' ? 'Task Reminder' :
                            type === 'shared' ? 'Task Shared' :
                            'New Task Assignment';

    // Only show native browser notification if the window is not focused
    if (!document.hasFocus()) {
      // Request permission if needed
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        console.warn('⚠️ Notification permission not granted');
        return false;
      }

      // Create and show the native notification
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

      // Handle notification click
      notification.onclick = function() {
        console.log('🔔 Notification clicked:', task.id);
        window.focus();
        if (location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      };
    }

    // Play notification sound
    await playNotificationSound();

    // Show in-app notification using AlertNotification
    const { showNotification } = useNotifications();
    showNotification({
      title: notificationTitle,
      message: task.title,
      type: 'info',
      action: {
        label: 'View Task',
        onClick: () => {
          if (location.pathname !== '/dashboard') {
            window.location.href = '/dashboard';
          }
        }
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Error showing notification:', error);
    return false;
  }
}
