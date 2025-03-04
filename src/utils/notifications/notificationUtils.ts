
import { Task } from "@/components/dashboard/TaskBoard";
import { isNotificationSupported, detectPlatform, isSafari } from "./platformDetection";
import { playNotificationSound } from "./soundUtils";

// Separate browser notification handling
async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!isNotificationSupported()) {
      console.warn('❌ Notifications not supported in this browser');
      return false;
    }

    const platform = detectPlatform();
    if (platform === 'ios-pwa') {
      console.log('🍎 iOS PWA notification permission check');
      // iOS handles permissions differently, check if we have any permission
      if (Notification.permission === 'granted') {
        return true;
      }
      
      // We'll try to request permission, but this might not show a prompt on iOS
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (iosError) {
        console.warn('🍎 iOS notification permission request issue:', iosError);
        // Return true to allow app-internal notifications even if system ones fail
        return true;
      }
    }

    // Standard flow for other platforms
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

// Show browser notification with iOS PWA support
export async function showBrowserNotification(task: Task, type: 'reminder' | 'shared' | 'assignment' = 'reminder'): Promise<boolean> {
  try {
    console.log('🔔 Attempting to show notification for task:', task.id);
    
    const platform = detectPlatform();
    const permissionGranted = await requestNotificationPermission();
    
    // For iOS PWA, we'll show in-app notifications using toast
    // as system notifications may not be reliable
    if (platform === 'ios-pwa') {
      console.log('🍎 Using iOS PWA notification approach');
      
      // Try to use the Notification API, but it might not work fully on iOS
      if (permissionGranted && 'Notification' in window) {
        try {
          const notificationTitle = type === 'reminder' ? 'Task Reminder' :
                                  type === 'shared' ? 'Task Shared' :
                                  'New Task Assignment';
                                  
          // Use simpler options for iOS compatibility
          const notification = new Notification(notificationTitle, {
            body: task.title,
            icon: '/favicon.ico'
          });
          
          console.log('✅ iOS notification shown successfully');
          return true;
        } catch (iosNotificationError) {
          console.warn('🍎 iOS notification creation failed, falling back:', iosNotificationError);
          // Fall through to use service worker messaging
        }
      }
      
      // Use service worker to handle iOS notifications if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_IOS_NOTIFICATION',
          payload: {
            id: task.id,
            title: type === 'reminder' ? 'Task Reminder' : 
                   type === 'shared' ? 'Task Shared' : 
                   'New Task Assignment',
            body: task.title
          }
        });
        console.log('✅ iOS notification request sent to service worker');
        return true;
      }
      
      return false;
    }
    
    // Standard web notification flow
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

export { playNotificationSound };
