
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initializeMessaging } from '@/integrations/firebase/config';
import { getToken } from 'firebase/messaging';
import { getAndSaveToken } from './tokenManagement';
import { PushNotifications } from '@capacitor/push-notifications';
import { isNativeApp, detectPlatform } from './platformDetection';

const setupNativePushNotifications = async () => {
  try {
    // Request permission to use push notifications
    const result = await PushNotifications.requestPermissions();

    if (result.receive !== 'granted') {
      throw new Error('Push notification permission was denied');
    }

    // Register with FCM
    await PushNotifications.register();

    // Get FCM token
    const { value: token } = await PushNotifications.getDeliveredNotifications();
    
    return token;
  } catch (error) {
    console.error('Error setting up native push notifications:', error);
    throw error;
  }
};

const checkNotificationPermission = async () => {
  if (isNativeApp()) {
    try {
      const permission = await PushNotifications.checkPermissions();
      return permission.receive === 'granted';
    } catch (error) {
      console.error('Error checking native notification permissions:', error);
      return false;
    }
  }

  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    const message = 'Notifications are blocked. Please enable them in your settings to receive task reminders.';
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

    if (isNativeApp()) {
      const token = await setupNativePushNotifications();
      if (token) {
        toast.success('Push notifications enabled successfully');
        return token;
      }
      return null;
    }
    
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
