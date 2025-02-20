
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initializeMessaging } from '@/integrations/firebase/config';
import { getToken } from 'firebase/messaging';
import { getAndSaveToken } from './tokenManagement';
import { isTwinrEnvironment, detectPlatform } from './platformDetection';

const checkNotificationPermission = async () => {
  // If we're in the Twinr environment, we'll use its native notification system
  if (isTwinrEnvironment()) {
    console.log('✅ Using Twinr notification system');
    return true;
  }

  // For web browsers
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    const message = 'Notifications are blocked. Please enable them in your browser settings to receive task reminders.';
    console.log('[Push Setup] Notifications blocked:', message);
    
    toast.error(message, {
      duration: 10000,
      action: {
        label: "How to enable",
        onClick: () => {
          window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank');
        }
      }
    });
    
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('📱 Notification permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[Push Setup] Error requesting notification permission:', error);
    return false;
  }
};

export const setupPushSubscription = async () => {
  try {
    console.log('[Push Setup] Setting up push notifications...');
    const platform = detectPlatform();
    console.log('Detected platform:', platform);

    // If we're in Twinr environment, use its native token fetch
    if (isTwinrEnvironment()) {
      try {
        console.log('Fetching Twinr push token...');
        const token = await (window as any).twinr_push_token_fetch();
        if (token) {
          console.log('✅ Twinr push token received');
          return token;
        }
        throw new Error('Failed to get Twinr push token');
      } catch (error) {
        console.error('Error getting Twinr push token:', error);
        throw new Error('Failed to setup native push notifications');
      }
    }

    // For web platform
    const isPermissionGranted = await checkNotificationPermission();
    if (!isPermissionGranted) {
      return null;
    }

    const tokenResponse = await getAndSaveToken();
    if (tokenResponse) {
      toast.success('Push notifications enabled successfully');
      return tokenResponse.token;
    }

    return null;
  } catch (error) {
    console.error('Error in setupPushSubscription:', error);
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to setup push notifications');
    }
    return null;
  }
};

export { checkNotificationPermission };
