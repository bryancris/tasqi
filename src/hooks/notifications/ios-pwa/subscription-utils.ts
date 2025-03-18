
import { supabase } from '@/integrations/supabase/client';
import { trackUserInteraction } from '@/utils/notifications/audio/audioCore';

/**
 * Checks the subscription status for iOS PWA notifications
 * First checks local storage preference, then falls back to database check
 * @returns Promise resolving to boolean indicating if notifications are enabled
 */
export async function checkIOSPWASubscriptionStatus(): Promise<boolean> {
  try {
    // Track user interaction for iOS audio playback
    trackUserInteraction();
    
    // First check local storage preference (most reliable for iOS PWA)
    const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
    if (localEnabled) {
      console.log('🍎 iOS PWA notifications enabled in local storage');
      return true;
    }
    
    // As a fallback, check if we have a stored token for this device
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const { data: tokens, error } = await supabase
        .from('push_device_tokens')
        .select('id')
        .eq('user_id', data.session.user.id)
        .eq('platform', 'ios-pwa')
        .limit(1);
        
      if (!error && tokens && tokens.length > 0) {
        console.log('✅ iOS PWA notification token found, setting subscribed to true');
        // Also update local storage to match
        localStorage.setItem('ios_pwa_notifications_enabled', 'true');
        return true;
      } else {
        console.log('ℹ️ No iOS PWA notification token found, setting subscribed to false');
        localStorage.removeItem('ios_pwa_notifications_enabled');
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking iOS PWA subscription status:', error);
    return false;
  }
}
