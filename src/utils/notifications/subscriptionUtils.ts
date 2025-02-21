
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAndSaveToken } from './tokenManagement';
import { detectPlatform, type PlatformType } from './platformDetection';

const checkNotificationPermission = async (platform: PlatformType): Promise<boolean> => {
  console.log('[Push Setup] Checking notification permission for platform:', platform);
  
  if (!('Notification' in window)) {
    console.log('[Push Setup] Web notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
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
      const message = 'Please enable notifications in your browser settings';
      toast.error(message, {
        duration: 10000,
        action: {
          label: "How to enable",
          onClick: () => window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank')
        }
      });
      return null;
    }

    // Web platform setup
    const tokenResponse = await getAndSaveToken();
    if (tokenResponse) {
      toast.success('Push notifications enabled successfully');
      return tokenResponse.token;
    }

    return null;
  } catch (error) {
    console.error('[Push Setup] Error in setupPushSubscription:', error);
    toast.error('Failed to setup push notifications');
    return null;
  }
};

export { checkNotificationPermission };
