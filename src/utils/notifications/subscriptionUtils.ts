
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
    console.log('✅ Notification permission already granted');
    return true;
  }

  // Check if permission is denied (blocked)
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

  // Request permission if not yet asked
  try {
    const permission = await Notification.requestPermission();
    console.log('📱 Notification permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[Push Setup] Error requesting notification permission:', error);
    return false;
  }
};

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser');
  }

  try {
    // First check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration();
    if (existingRegistration?.active) {
      console.log('✅ Service Worker already registered and active');
      return existingRegistration;
    }

    // If not registered or not active, register it
    console.log('🔄 Registering Service Worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });

    // Wait for the service worker to be ready
    if (registration.installing) {
      console.log('⏳ Waiting for Service Worker to be installed...');
      await new Promise((resolve) => {
        registration.installing?.addEventListener('statechange', (e) => {
          if (e.target?.state === 'activated') {
            resolve(true);
          }
        });
      });
    }

    console.log('✅ Service Worker registered and activated successfully');
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    throw error;
  }
};

export const setupPushSubscription = async () => {
  try {
    console.log('[Push Setup] Setting up web push notifications...');
    
    // First check notification permission
    const isPermissionGranted = await checkNotificationPermission();
    if (!isPermissionGranted) {
      return null;
    }

    // Register service worker first and wait for it to be ready
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Failed to register service worker');
    }

    const messaging = await initializeMessaging();
    if (!messaging) {
      throw new Error('Failed to initialize Firebase Messaging');
    }

    try {
      const fcmToken = await getFirebaseToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: 'BPYfG5p8YrAG9bsK0YeJ5YrXKcAy9wcm2LhQIHzJODbVW6gJnQUtlOsJA_XPtX4hC46QqLshhkTQ9HJxcOkIZXc'
      });

      if (!fcmToken) {
        throw new Error('Failed to get FCM token');
      }

      console.log('✅ FCM token received successfully');
      await savePushSubscription(fcmToken);
      toast.success('Push notifications enabled successfully');
      return fcmToken;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission-blocked')) {
        toast.error('Please enable notifications in your browser settings to receive task reminders');
        return null;
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in setupPushSubscription:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to setup push notifications');
    return null;
  }
};
