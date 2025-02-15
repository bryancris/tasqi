
import { supabase } from "@/integrations/supabase/client";
import { urlBase64ToUint8Array, getVapidPublicKey } from "./vapidUtils";
import { toast } from "sonner";
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';

const isNativePlatform = () => Capacitor.isNativePlatform();

export const savePushSubscription = async (subscription: PushSubscription | string, deviceType: 'web' | 'android' | 'ios' = 'web') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to save push subscription');
    }

    const subscriptionData = deviceType === 'web' 
      ? {
          device_type: 'web',
          endpoint: (subscription as PushSubscription).endpoint,
          auth_keys: {
            p256dh: (subscription as PushSubscription).toJSON().keys?.p256dh,
            auth: (subscription as PushSubscription).toJSON().keys?.auth
          }
        }
      : {
          device_type: deviceType,
          fcm_token: subscription as string,
          device_info: {
            platform: deviceType,
            timestamp: new Date().toISOString()
          }
        };

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        ...subscriptionData
      }, {
        onConflict: deviceType === 'web' 
          ? 'user_id,endpoint' 
          : 'user_id,fcm_token'
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }

    console.log(`✅ ${deviceType.toUpperCase()} push subscription saved successfully`);
  } catch (error) {
    console.error('Error in savePushSubscription:', error);
    toast.error('Failed to save push subscription');
    throw error;
  }
};

export const setupPushSubscription = async (registration?: ServiceWorkerRegistration) => {
  try {
    // Check if we're on a native platform
    if (isNativePlatform()) {
      console.log('Setting up native push notifications...');
      
      // Request permission for native platforms
      const { receive } = await FirebaseMessaging.requestPermissions();
      
      if (receive !== 'granted') {
        throw new Error('Permission not granted for push notifications');
      }

      // Get the FCM token
      const { token } = await FirebaseMessaging.getToken();
      console.log('FCM Token:', token);

      // Set up native notification handlers
      FirebaseMessaging.addListener('notificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
        console.log('Push notification action:', action);
      });

      // Save the FCM token
      const platform = Capacitor.getPlatform();
      await savePushSubscription(token, platform as 'android' | 'ios');
      
      return token;
    }
    
    // Web platform setup
    console.log('Setting up web push subscription...');
    
    if (!registration) {
      throw new Error('ServiceWorkerRegistration is required for web push notifications');
    }

    const existingSubscription = await registration.pushManager.getSubscription();
      
    if (existingSubscription) {
      console.log('Using existing web push subscription');
      await savePushSubscription(existingSubscription);
      return existingSubscription;
    }

    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not found in app settings');
    }

    console.log('Creating new web push subscription...');
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    };
    
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('✅ Web push notification subscription created:', subscription);
    
    await savePushSubscription(subscription);
    return subscription;
  } catch (error) {
    console.error('Error in setupPushSubscription:', error);
    toast.error('Failed to setup push notifications');
    throw error;
  }
};

