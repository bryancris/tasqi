
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

const checkNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  // Check if permission is already granted
  if (Notification.permission === 'granted') {
    return true;
  }

  // Check if permission is denied (blocked)
  if (Notification.permission === 'denied') {
    const message = 'Notifications are blocked. Please enable them in your browser settings to receive task reminders.';
    console.log('[Push Setup] Notifications blocked:', message);
    
    // Show a toast with instructions
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

  // Request permission if not yet asked
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('[Push Setup] Error requesting notification permission:', error);
    return false;
  }
};

const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker registered successfully:', registration);
      return registration;
    }
    throw new Error('Service Worker not supported in this browser');
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
};

export const setupPushSubscription = async () => {
  try {
    console.log('[Push Setup] Setting up web push notifications...');
    
    // First check notification permission
    const isPermissionGranted = await checkNotificationPermission();
    if (!isPermissionGranted) {
      // Don't throw here, just return null to prevent error cascading
      return null;
    }

    // Register service worker first
    await registerServiceWorker();
    console.log('✅ Service Worker registered and ready');
    
    const messaging = await initializeMessaging();
    if (!messaging) {
      const error = new Error('Failed to initialize Firebase Messaging. Please ensure Firebase is properly configured in app settings.');
      console.error('[Push Setup] Error:', error);
      toast.error(error.message);
      return null;
    }

    try {
      const fcmToken = await getFirebaseToken(messaging, {
        vapidKey: 'BPYfG5p8YrAG9bsK0YeJ5YrXKcAy9wcm2LhQIHzJODbVW6gJnQUtlOsJA_XPtX4hC46QqLshhkTQ9HJxcOkIZXc'
      });
      console.log('[Push Setup] Web FCM Token received');
      
      await savePushSubscription(fcmToken);
      toast.success('Push notifications enabled successfully');
      return fcmToken;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission-blocked')) {
        console.error('[Push Setup] Permission blocked:', error);
        toast.error('Please enable notifications in your browser settings to receive task reminders');
        return null;
      }
      
      console.error('[Push Setup] Error getting FCM token:', error);
      toast.error('Failed to set up push notifications');
      return null;
    }
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
