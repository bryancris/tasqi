
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAndSaveToken } from './tokenManagement';
import { detectPlatform, type PlatformType, isSafari, getIOSVersion } from './platformDetection';

const checkNotificationPermission = async (platform: PlatformType): Promise<boolean> => {
  console.log('[Push Setup] Checking notification permission for platform:', platform);
  
  // iOS PWA specific handling
  if (platform === 'ios-pwa') {
    console.log('[Push Setup] iOS PWA detected, using special permission flow');
    
    try {
      // iOS has limitations with the Notification API in PWAs
      // We'll try the API but also provide iOS-specific guidance
      
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          return true;
        }
        
        if (Notification.permission === 'denied') {
          // Show iOS-specific instructions for denied permissions
          toast.error('Notifications are blocked in your iOS settings', {
            duration: 10000,
            action: {
              label: "How to enable",
              onClick: () => window.open('https://support.apple.com/guide/iphone/notifications-iph7c3d96bab/ios', '_blank')
            }
          });
          return false;
        }
        
        // Request permission with fallback for iOS
        const permission = await Notification.requestPermission();
        
        // iOS Safari may silently fail without properly requesting
        // Make sure we guide users appropriately
        if (permission === 'granted') {
          return true;
        } else {
          // Show iOS-specific instructions
          const iosVersion = getIOSVersion();
          toast.info(
            `To enable notifications on iOS ${iosVersion || ''}, please check your device settings`,
            {
              duration: 15000,
              action: {
                label: "Show Instructions",
                onClick: () => window.open('https://support.apple.com/guide/iphone/notifications-iph7c3d96bab/ios', '_blank')
              }
            }
          );
          return false;
        }
      } else {
        // If Notification API is not available on this iOS device
        toast.info('Your iOS device may have limited notification support', {
          duration: 10000
        });
        // We'll return true to allow other fallback mechanisms to be tried
        return true;
      }
    } catch (error) {
      console.error('[Push Setup] Error handling iOS notification permission:', error);
      // Show iOS-specific error message
      toast.error('Unable to setup notifications on this iOS device', {
        duration: 8000
      });
      return false;
    }
  }
  
  // Standard web notification permission flow
  if (!('Notification' in window)) {
    console.log('[Push Setup] Web notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    const isAppleBrowser = /iPad|iPhone|iPod/.test(navigator.userAgent) || isSafari();
    
    // Show browser-appropriate guidance
    if (isAppleBrowser) {
      toast.error('Please enable notifications in your Safari settings', {
        duration: 10000,
        action: {
          label: "How to enable",
          onClick: () => window.open('https://support.apple.com/guide/safari/notifications-ibrwe2529d93/mac', '_blank')
        }
      });
    } else {
      toast.error('Please enable notifications in your browser settings', {
        duration: 10000,
        action: {
          label: "How to enable",
          onClick: () => window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank')
        }
      });
    }
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('[Push Setup] Error requesting web notification permission:', error);
    return false;
  }
};

export const setupPushSubscription = async () => {
  try {
    const platform = detectPlatform();
    console.log('[Push Setup] Setting up push notifications for platform:', platform);

    const isPermissionGranted = await checkNotificationPermission(platform);
    if (!isPermissionGranted) {
      // Permission handling is done in checkNotificationPermission
      return null;
    }

    if (platform === 'ios-pwa') {
      // iOS PWA specific setup
      console.log('[Push Setup] Using iOS-specific notification setup');
      
      // For iOS PWAs, we use a simpler approach with local notifications
      // since push notification support is limited
      
      // Generate a token for identification
      const tokenResponse = await getAndSaveToken();
      
      if (tokenResponse) {
        // Set up service worker for iOS
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/'
            });
            console.log('[Push Setup] iOS service worker registered:', registration);
            
            // iOS requires permissions to be requested from the service worker
            if (registration.active) {
              registration.active.postMessage({
                type: 'INIT_IOS_NOTIFICATIONS'
              });
            }
          } catch (swError) {
            console.error('[Push Setup] iOS service worker registration error:', swError);
          }
        }
        
        // Show success message appropriate for iOS
        toast.success('Notifications enabled for this device', {
          description: 'You may need to keep the app open to receive all notifications'
        });
        
        return tokenResponse.token;
      }
    } else {
      // Standard web platform setup
      const tokenResponse = await getAndSaveToken();
      if (tokenResponse) {
        toast.success('Push notifications enabled successfully');
        return tokenResponse.token;
      }
    }

    return null;
  } catch (error) {
    console.error('[Push Setup] Error in setupPushSubscription:', error);
    toast.error('Failed to setup push notifications');
    return null;
  }
};

export { checkNotificationPermission };
