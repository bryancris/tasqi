
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
        description: "Please enable notifications in your browser settings",
        duration: 5000,
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log('🔔 Notification permission status:', permission);
    
    if (permission === 'granted') {
      toast.success("Notifications enabled successfully");
    } else {
      toast.error("Notification permission denied", {
        duration: 5000,
      });
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    toast.error("Failed to request notification permission", {
      duration: 5000,
    });
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

    // Request permission if needed
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.warn('⚠️ Notification permission not granted');
      return false;
    }

    // Play notification sound
    await playNotificationSound();

    // Get notification title based on type
    const notificationTitle = type === 'reminder' ? 'Task Reminder' :
                            type === 'shared' ? 'Task Shared' :
                            'New Task Assignment';

    // Create and show the notification
    const notification = new Notification(notificationTitle, {
      body: task.title,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `task-${task.id}`,
      data: { taskId: task.id, type },
      requireInteraction: true, // Keep notification visible until user interacts with it
      silent: false, // Enable native browser sound
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
    });

    // Show toast as additional UI feedback
    toast(notificationTitle, {
      description: task.title,
      duration: 8000,
      action: {
        label: "View",
        onClick: () => {
          window.focus();
          if (location.pathname !== '/dashboard') {
            window.location.href = '/dashboard';
          }
        }
      }
    });

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
    toast.error(type === 'reminder' ? "Task Reminder" : 
               type === 'shared' ? "Task Shared" :
               "New Task Assignment", {
      description: task.title,
      duration: 8000,
      action: {
        label: "View",
        onClick: () => {
          if (location.pathname !== '/dashboard') {
            window.location.href = '/dashboard';
          }
        }
      }
    });
    return false;
  }
}
