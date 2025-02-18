
import { supabase } from "@/integrations/supabase/client";
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

export const savePushSubscription = async (fcmToken: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to save push subscription');
    }

    console.log('[Push Subscription] Saving FCM token:', fcmToken);

    // Update the FCM token in the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', session.user.id);

    if (error) {
      console.error('[Push Subscription] Error saving FCM token:', error);
      throw error;
    }

    console.log('✅ FCM token saved successfully');
  } catch (error) {
    console.error('[Push Subscription] Error in savePushSubscription:', error);
    toast.error('Failed to save push subscription');
    throw error;
  }
};

export const setupPushSubscription = async () => {
  try {
    // Check if we're on a native platform
    if (isNativePlatform()) {
      console.log('[Push Setup] Setting up native push notifications...');
      
      try {
        // Request permission for native platforms
        const { receive } = await FirebaseMessaging.requestPermissions();
        console.log('[Push Setup] Permission status:', receive);
        
        if (receive !== 'granted') {
          throw new Error('Permission not granted for push notifications');
        }

        // Get the FCM token for native platforms
        const { token } = await FirebaseMessaging.getToken();
        console.log('[Push Setup] Native FCM Token received');

        // Save the FCM token
        await savePushSubscription(token);
        
        // Set up native notification handlers
        FirebaseMessaging.addListener('notificationReceived', (notification) => {
          console.log('[Push Notification] Received:', notification);
        });

        FirebaseMessaging.addListener('notificationActionPerformed', (action) => {
          console.log('[Push Notification] Action performed:', action);
        });

        toast.success('Push notifications enabled successfully');
        return token;
      } catch (error) {
        console.error('[Push Setup] Native setup error:', error);
        toast.error('Failed to set up push notifications');
        throw error;
      }
    }
    
    // Web platform setup
    console.log('[Push Setup] Setting up web push notifications...');
    
    const messaging = await initializeMessaging();
    if (!messaging) {
      throw new Error('Failed to initialize Firebase Messaging');
    }

    try {
      const fcmToken = await getFirebaseToken(messaging);
      console.log('[Push Setup] Web FCM Token received');
      
      await savePushSubscription(fcmToken);
      return fcmToken;
    } catch (error) {
      console.error('[Push Setup] Error getting FCM token:', error);
      toast.error('Failed to set up push notifications');
      throw error;
    }
  } catch (error) {
    console.error('Error in setupPushSubscription:', error);
    toast.error('Failed to setup push notifications');
    throw error;
  }
};
