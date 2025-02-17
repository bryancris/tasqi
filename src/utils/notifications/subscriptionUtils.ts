import { supabase } from "@/integrations/supabase/client";
import { urlBase64ToUint8Array, getVapidPublicKey } from "./vapidUtils";
import { toast } from "sonner";
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { initializeMessaging } from '@/integrations/firebase/config';
import { getToken as getFirebaseToken } from 'firebase/messaging';

const isNativePlatform = () => {
  const isNative = Capacitor.isNativePlatform();
  console.log('Is native platform?', isNative, 'Current platform:', Capacitor.getPlatform());
  return isNative;
};

export const savePushSubscription = async (subscription: PushSubscription | string, deviceType: 'web' | 'android' | 'ios' = 'web') => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to save push subscription');
    }

    console.log(`[Push Subscription] Attempting to save ${deviceType} subscription`);
    console.log(`[Push Subscription] Platform detected: ${Capacitor.getPlatform()}`);
    console.log(`[Push Subscription] Token/Subscription:`, subscription);

    const baseData = {
      user_id: session.user.id,
      auth_keys: {} // Provide empty object as default for auth_keys
    };

    const subscriptionData = deviceType === 'web' 
      ? {
          ...baseData,
          platform: 'web' as const,
          endpoint: (subscription as PushSubscription).endpoint,
          auth_keys: {
            p256dh: (subscription as PushSubscription).toJSON().keys?.p256dh,
            auth: (subscription as PushSubscription).toJSON().keys?.auth
          }
        }
      : {
          ...baseData,
          platform: deviceType,
          endpoint: '', // Provide empty string as required by the schema
          device_token: subscription as string,
          device_type: deviceType, // Explicitly set device_type
          metadata: {
            platform: deviceType,
            capacitorPlatform: Capacitor.getPlatform(),
            timestamp: new Date().toISOString()
          }
        };

    console.log('[Push Subscription] Saving data:', JSON.stringify(subscriptionData, null, 2));

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData, {
        onConflict: deviceType === 'web' 
          ? 'user_id,platform,endpoint' 
          : 'user_id,platform,device_token'
      });

    if (error) {
      console.error('[Push Subscription] Error saving subscription:', error);
      throw error;
    }

    console.log(`[Push Subscription] ✅ ${deviceType.toUpperCase()} subscription saved successfully`);
  } catch (error) {
    console.error('[Push Subscription] Error in savePushSubscription:', error);
    toast.error('Failed to save push subscription');
    throw error;
  }
};

export const setupPushSubscription = async (registration?: ServiceWorkerRegistration) => {
  try {
    // Check if we're on a native platform
    if (isNativePlatform()) {
      console.log('[Push Setup] Setting up native push notifications...');
      console.log('[Push Setup] Current platform:', Capacitor.getPlatform());
      
      try {
        // Request permission for native platforms
        const { receive } = await FirebaseMessaging.requestPermissions();
        console.log('[Push Setup] Permission status:', receive);
        
        if (receive !== 'granted') {
          throw new Error('Permission not granted for push notifications');
        }

        // Get the FCM token for native platforms
        const { token } = await FirebaseMessaging.getToken();
        console.log('[Push Setup] Native FCM Token received:', token?.slice(0, 10) + '...');

        // Set up native notification handlers
        FirebaseMessaging.addListener('notificationReceived', (notification) => {
          console.log('[Push Notification] Received:', notification);
        });

        FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
          console.log('[Push Notification] Action performed:', action);
        });

        // Save the FCM token with the correct platform
        const platform = Capacitor.getPlatform();
        if (platform !== 'android' && platform !== 'ios') {
          throw new Error(`Unexpected platform: ${platform}`);
        }
        
        await savePushSubscription(token, platform);
        
        toast.success('Push notifications enabled successfully');
        return token;
      } catch (error) {
        console.error('[Push Setup] Native setup error:', error);
        toast.error('Failed to set up push notifications. Please check app permissions.');
        throw error;
      }
    }
    
    // Web platform setup
    console.log('Setting up web push subscription...');
    
    if (!registration) {
      throw new Error('ServiceWorkerRegistration is required for web push notifications');
    }

    // Try to get Firebase messaging token for web platform
    const messaging = await initializeMessaging();
    if (messaging) {
      try {
        const fcmToken = await getFirebaseToken(messaging, {
          vapidKey: await getVapidPublicKey()
        });
        console.log('Web FCM Token:', fcmToken);
        await savePushSubscription(fcmToken, 'web');
        return fcmToken;
      } catch (error) {
        console.warn('Failed to get Firebase token, falling back to Web Push:', error);
      }
    }

    // Fall back to Web Push API if Firebase is not available
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
