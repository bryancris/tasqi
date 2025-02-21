
import { Task } from "@/components/dashboard/TaskBoard";
import { isNotificationSupported } from "./platformDetection";
import { toast } from "sonner";

async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!isNotificationSupported()) {
      console.warn('❌ Notifications not supported in this browser');
      toast.error("Notifications are not supported in this browser");
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('❌ Notification permission denied');
      toast.error("Notification permission denied", {
        description: "Please enable notifications in your browser settings"
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log('🔔 Notification permission status:', permission);
    
    if (permission === 'granted') {
      toast.success("Notifications enabled successfully");
    } else {
      toast.error("Notification permission denied");
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    toast.error("Failed to request notification permission");
    return false;
  }
}

export async function showNotification(task: Task, type: 'reminder' | 'shared' = 'reminder'): Promise<boolean> {
  try {
    console.log('🔔 Showing notification:', {
      taskId: task.id,
      type,
      title: task.title
    });

    // Request permission if needed
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.warn('⚠️ Notification permission not granted');
      return false;
    }

    // Create and show the notification
    const notification = new Notification(
      type === 'reminder' ? 'Task Reminder' : 'Task Shared',
      {
        body: task.title,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `task-${task.id}`,
        data: { taskId: task.id, type },
        requireInteraction: true // Keep notification visible until user interacts with it
      }
    );

    // Handle notification click
    notification.onclick = function() {
      console.log('🔔 Notification clicked:', task.id);
      window.focus();
      // Navigate to the task if needed
      if (location.pathname !== '/dashboard') {
        window.location.href = '/dashboard';
      }
    };

    return true;
  } catch (error) {
    console.error('❌ Error showing notification:', error);
    // Fallback to toast notification
    toast.error("Unable to show notification", {
      description: task.title
    });
    return false;
  }
}
