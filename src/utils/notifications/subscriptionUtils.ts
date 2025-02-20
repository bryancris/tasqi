
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAndSaveToken } from './tokenManagement';
import { isTwinrEnvironment, detectPlatform, type PlatformType } from './platformDetection';

const handleTwinrPermissions = async (): Promise<boolean> => {
  try {
    console.log('[Push Setup] Checking Twinr permissions...');
    const token = await (window as any).twinr_push_token_fetch();
    const hasPermission = !!token;
    console.log('[Push Setup] Twinr permission status:', hasPermission);
    return hasPermission;
  } catch (error) {
    console.error('[Push Setup] Error checking Twinr permissions:', error);
    return false;
  }
};

const handleWebPermissions = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('[Push Setup] Web notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('[Push Setup] Error requesting web notification permission:', error);
    return false;
  }
};

const checkNotificationPermission = async (platform: PlatformType): Promise<boolean> => {
  console.log('[Push Setup] Checking notification permission for platform:', platform);
  
  if (platform === 'android' || platform === 'ios') {
    return handleTwinrPermissions();
  }
  
  return handleWebPermissions();
};

export const setupPushSubscription = async () => {
  try {
    const platform = detectPlatform();
    console.log('[Push Setup] Setting up push notifications for platform:', platform);

    const isPermissionGranted = await checkNotificationPermission(platform);
    if (!isPermissionGranted) {
      const message = platform === 'web' 
        ? 'Please enable notifications in your browser settings'
        : 'Please enable notifications in your app settings';
        
      toast.error(message, {
        duration: 10000,
        action: platform === 'web' ? {
          label: "How to enable",
          onClick: () => window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank')
        } : undefined
      });
      return null;
    }

    if (platform === 'android' || platform === 'ios') {
      const token = await (window as any).twinr_push_token_fetch();
      if (!token) {
        console.error('[Push Setup] Failed to get Twinr push token');
        toast.error('Failed to enable notifications');
        return null;
      }

      console.log('[Push Setup] Successfully got Twinr token');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase
          .from('push_device_tokens')
          .upsert({
            user_id: session.user.id,
            token: token,
            platform: platform,
            token_source: 'twinr',
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('[Push Setup] Error saving Twinr token:', error);
          toast.error('Failed to save notification settings');
          return null;
        }
      }

      toast.success('Notifications enabled successfully');
      return token;
    }

    // Web platform setup
    const tokenResponse = await getAndSaveToken();
    if (tokenResponse) {
      toast.success('Push notifications enabled successfully');
      return tokenResponse.token;
    }

    return null;
  } catch (error) {
    console.error('[Push Setup] Error in setupPushSubscription:', error);
    toast.error('Failed to setup push notifications');
    return null;
  }
};

export { checkNotificationPermission };
