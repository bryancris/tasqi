
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initializeMessaging } from '@/integrations/firebase/config';
import { getToken as getFirebaseToken } from 'firebase/messaging';

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
    console.log('[Push Setup] Setting up web push notifications...');
    
    const messaging = await initializeMessaging();
    if (!messaging) {
      const error = new Error('Failed to initialize Firebase Messaging. Please ensure Firebase is properly configured in app settings.');
      console.error('[Push Setup] Error:', error);
      toast.error(error.message);
      throw error;
    }

    try {
      const fcmToken = await getFirebaseToken(messaging);
      console.log('[Push Setup] Web FCM Token received');
      
      await savePushSubscription(fcmToken);
      toast.success('Push notifications enabled successfully');
      return fcmToken;
    } catch (error) {
      console.error('[Push Setup] Error getting FCM token:', error);
      toast.error('Failed to set up push notifications');
      throw error;
    }
  } catch (error) {
    console.error('Error in setupPushSubscription:', error);
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to setup push notifications');
    }
    throw error;
  }
};
