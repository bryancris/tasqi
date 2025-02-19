
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initializeMessaging } from '@/integrations/firebase/config';
import { getToken } from 'firebase/messaging';

export const savePushSubscription = async (fcmToken: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to save push subscription');
    }

    console.log('[Push Subscription] Saving FCM token:', fcmToken);

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

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser');
  }

  try {
    console.log('[Push Setup] Registering service worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      type: 'module'
    });
    
    // Wait for the service worker to be ready
    if (registration.installing) {
      console.log('[Push Setup] Service worker installing...');
      await new Promise(resolve => {
        registration.installing?.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') {
            console.log('[Push Setup] Service worker activated');
            resolve(true);
          }
        });
      });
    }

    console.log('✅ Service Worker registered and active:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    throw error;
  }
};

export const setupPushSubscription = async () => {
  try {
    console.log('[Push Setup] Setting up web push notifications...');
    
    const isPermissionGranted = await checkNotificationPermission();
    if (!isPermissionGranted) {
      return null;
    }

    const swRegistration = await registerServiceWorker();
    if (!swRegistration) {
      throw new Error('Failed to register service worker');
    }

    const messaging = await initializeMessaging();
    if (!messaging) {
      throw new Error('Failed to initialize Firebase Messaging');
    }

    console.log('[Push Setup] Getting FCM token...');
    const fcmToken = await getToken(messaging, {
      vapidKey: 'BJZ6tqQupAynUEEzG1BLkVBF6_uRTkGgNMPF31bEPYnfn6kG-4hFxn1n1Roz6Ys2-Ihy0SYDSAl-I8r0O2-YhKA',
      serviceWorkerRegistration: swRegistration
    }).catch(error => {
      console.error('Error getting FCM token:', error);
      throw error;
    });

    if (!fcmToken) {
      throw new Error('Failed to get FCM token');
    }

    console.log('✅ FCM token received successfully');
    await savePushSubscription(fcmToken);
    toast.success('Push notifications enabled successfully');
    return fcmToken;
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
