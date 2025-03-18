
import { toast } from "sonner";
import { Task } from "@/components/dashboard/TaskBoard";

/**
 * Shows a browser notification if permission is granted
 * 
 * @param task The task data or notification object
 * @param type The notification type (reminder, shared, assignment)
 * @returns Promise that resolves when notification is shown
 */
export async function showBrowserNotification(
  task: Task | any,
  type: 'reminder' | 'shared' | 'assignment' = 'reminder'
): Promise<boolean> {
  // If window is focused, don't show browser notification
  if (document.hasFocus()) {
    console.log('🌐 Window is focused, skipping browser notification');
    return false;
  }

  // Check if browser supports notifications
  if (!("Notification" in window)) {
    console.log('🌐 Browser does not support notifications');
    return false;
  }

  try {
    // Check and request permission if needed (will return current state if already decided)
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.log('🌐 Notification permission not granted:', permission);
      return false;
    }

    // Format the title and message
    const title = type === 'reminder' ? 'Task Reminder' :
                 type === 'shared' ? 'Task Shared' :
                 'New Task Assignment';
                 
    const message = task.title || 'A task needs your attention';
    
    // Create the notification with improved options
    const notification = new Notification(title, {
      body: message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: `task-${task.id || 'unknown'}-${Date.now()}`, // Unique tag to avoid duplicates
      vibrate: [100, 50, 100], // Vibration pattern [vibrate, pause, vibrate]
      renotify: true, // Still notify even if same tag (with vibration/sound)
      silent: false, // Use default sound
      requireInteraction: true, // Keep notification visible until user interacts
      data: { task, type } // Store data for click handlers
    });

    // Add click handler for the notification
    notification.onclick = () => {
      console.log('🌐 Browser notification clicked');
      
      // Focus the window
      window.focus();
      
      // Close the notification
      notification.close();
      
      // Don't navigate for now - the in-app notification will handle that
    };

    console.log('🌐 Browser notification shown successfully');
    return true;
  } catch (error) {
    console.error('🌐 Error showing browser notification:', error);
    return false;
  }
}

/**
 * Utility to create a debug toast notification
 * 
 * @param message Message to display
 * @param type Toast type
 */
export function showDebugToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  console.log(`🍞 Debug toast (${type}):`, message);
  
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    case 'error':
      toast.error(message);
      break;
    default:
      toast.info(message);
  }
}
