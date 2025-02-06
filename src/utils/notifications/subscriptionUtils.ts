
import { supabase } from "@/integrations/supabase/client";
import { urlBase64ToUint8Array, getVapidPublicKey } from "./vapidUtils";
import { toast } from "sonner";

export const savePushSubscription = async (subscription: PushSubscription) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to save push subscription');
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        endpoint: subscription.endpoint,
        auth_keys: {
          p256dh: subscription.toJSON().keys?.p256dh,
          auth: subscription.toJSON().keys?.auth
        }
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }

    console.log('✅ Push subscription saved successfully');
  } catch (error) {
    console.error('Error in savePushSubscription:', error);
    toast.error('Failed to save push subscription');
    throw error;
  }
};

export const setupPushSubscription = async (registration: ServiceWorkerRegistration) => {
  try {
    console.log('Setting up push subscription...');
    const existingSubscription = await registration.pushManager.getSubscription();
      
    if (existingSubscription) {
      console.log('Using existing push subscription');
      await savePushSubscription(existingSubscription);
      return existingSubscription;
    }

    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not found in app settings');
    }

    console.log('Creating new push subscription...');
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    };
    
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('✅ Push notification subscription created:', subscription);
    
    await savePushSubscription(subscription);
    return subscription;
  } catch (error) {
    console.error('Error in setupPushSubscription:', error);
    toast.error('Failed to setup push notifications');
    throw error;
  }
};
