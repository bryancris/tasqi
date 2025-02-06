
import { supabase } from "@/integrations/supabase/client";
import { urlBase64ToUint8Array, getVapidPublicKey } from "./vapidUtils";

export const savePushSubscription = async (subscription: PushSubscription) => {
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
};

export const setupPushSubscription = async (registration: ServiceWorkerRegistration) => {
  const existingSubscription = await registration.pushManager.getSubscription();
      
  if (!existingSubscription) {
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not found in app settings');
    }

    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    };
    
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log('✅ Push notification subscription created:', subscription);
    
    // Save the subscription to our backend
    await savePushSubscription(subscription);
    return subscription;
  }

  return existingSubscription;
};
