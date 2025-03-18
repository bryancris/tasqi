
import { toast } from 'sonner';

/**
 * Requests notification permissions specifically for iOS PWA
 * Handles iOS-specific quirks with permissions
 * @returns Promise resolving when permission request is complete
 */
export async function requestIOSPWAPermission(): Promise<void> {
  if ('Notification' in window) {
    try {
      // Add a timeout to prevent hanging
      const permission = await Promise.race([
        Notification.requestPermission(),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 3000))
      ]);
      
      console.log('🍎 iOS notification permission result:', permission);
      
      // Only show guidance if explicitly denied
      if (permission === 'denied') {
        toast.info('Enable notifications in iOS Settings to receive reminders', {
          duration: 6000,
          action: {
            label: 'Learn How',
            onClick: () => window.open('https://support.apple.com/guide/iphone/notifications-iph7c3d96bab/ios', '_blank')
          }
        });
      }
    } catch (err) {
      // Just log the error and continue
      console.warn('🍎 iOS permission request issue, continuing anyway:', err);
    }
  }
}

/**
 * Checks the current notification permission status
 * @returns The current permission status or null if not available
 */
export function checkNotificationPermission(): 'granted' | 'denied' | 'default' | null {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return null;
}
