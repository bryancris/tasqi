
import { supabase } from "@/integrations/supabase/client";
import { savePushSubscription } from "./subscriptionUtils";
import { toast } from "sonner";

export const registerAndroidToken = async (fcmToken: string, deviceId?: string) => {
  try {
    console.log('[Android Push] Registering FCM token:', { fcmToken, deviceId });
    
    await savePushSubscription(fcmToken, 'android');
    
    console.log('✅ Android FCM token registered successfully');
    return true;
  } catch (error) {
    console.error('[Android Push] Error registering token:', error);
    toast.error('Failed to register device for notifications');
    return false;
  }
};

export const unregisterAndroidToken = async (fcmToken: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('User must be logged in to unregister device');
    }

    console.log('[Android Push] Unregistering FCM token:', fcmToken);

    const { error } = await supabase
      .from('push_device_tokens')
      .delete()
      .match({ 
        user_id: session.user.id,
        token: fcmToken,
        platform: 'android'
      });

    if (error) throw error;
    
    console.log('✅ Android FCM token unregistered successfully');
    return true;
  } catch (error) {
    console.error('[Android Push] Error unregistering token:', error);
    toast.error('Failed to unregister device');
    return false;
  }
};
