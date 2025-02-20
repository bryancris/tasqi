
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initializeMessaging } from '@/integrations/firebase/config';
import { getToken } from 'firebase/messaging';
import { getAndSaveToken } from './tokenManagement';
import { isTwinrEnvironment, detectPlatform } from './platformDetection';

const checkNotificationPermission = async () => {
  const platform = detectPlatform();
  console.log('[Push Setup] Checking notification permission for platform:', platform);

  // Check for Twinr environment first
  if (isTwinrEnvironment()) {
    try {
      console.log('[Push Setup] In Twinr environment, checking native permissions...');
      // Attempt to get token to verify permissions
      const token = await (window as any).twinr_push_token_fetch();
      if (token) {
        console.log('✅ Twinr notifications are enabled');
        return true;
      }
      console.log('❌ Twinr notifications are not enabled');
      return false;
    } catch (error) {
      console.error('[Push Setup] Error checking Twinr permissions:', error);
      return false;
    }
  }

  // Web browser checks
  if (!('Notification' in window)) {
    console.log('❌ Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Browser notification permission already granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('❌ Browser notifications are blocked');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('📱 Browser notification permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[Push Setup] Error requesting browser notification permission:', error);
    return false;
  }
};

export const setupPushSubscription = async () => {
  try {
    const platform = detectPlatform();
    console.log('[Push Setup] Setting up push notifications for platform:', platform);

    if (isTwinrEnvironment()) {
      console.log('[Push Setup] Setting up Twinr notifications...');
      try {
        const token = await (window as any).twinr_push_token_fetch();
        if (!token) {
          console.error('[Push Setup] Failed to get Twinr push token');
          toast.error('Failed to enable notifications. Please check app permissions.');
          return null;
        }

        console.log('✅ Twinr push token received:', token.slice(0, 10) + '...');
        
        // Save the token to Supabase
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
      } catch (error) {
        console.error('[Push Setup] Error in Twinr setup:', error);
        toast.error('Failed to enable notifications. Please check app permissions.');
        return null;
      }
    }

    // Web platform setup
    console.log('[Push Setup] Setting up web notifications...');
    const isPermissionGranted = await checkNotificationPermission();
    if (!isPermissionGranted) {
      const message = 'Notifications are blocked. Please enable them in your browser settings.';
      toast.error(message, {
        duration: 10000,
        action: {
          label: "How to enable",
          onClick: () => {
            window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank');
          }
        }
      });
      return null;
    }

    const tokenResponse = await getAndSaveToken();
    if (tokenResponse) {
      toast.success('Push notifications enabled successfully');
      return tokenResponse.token;
    }

    return null;
  } catch (error) {
    console.error('[Push Setup] Error in setupPushSubscription:', error);
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to setup push notifications');
    }
    return null;
  }
};

export { checkNotificationPermission };
