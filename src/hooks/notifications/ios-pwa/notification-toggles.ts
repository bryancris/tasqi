import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackUserInteraction } from '@/utils/notifications/audio/audioCore';
import { requestIOSPWAPermission } from './permission-utils';

/**
 * Enables iOS PWA notifications
 * Sets up local storage flag, requests permissions, and saves token to database
 * @returns Promise resolving to boolean indicating success
 */
export async function enableIOSPWANotifications(): Promise<boolean> {
  console.log('🍎 Setting up iOS PWA notifications');
  
  // Track user interaction for iOS audio playback
  trackUserInteraction();
  
  // Set the local storage flag first for UI consistency
  localStorage.setItem('ios_pwa_notifications_enabled', 'true');
  
  // Try to request permission, but continue whether it succeeds or not
  await requestIOSPWAPermission();
  
  // Save a device token for this iOS PWA
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Generate a unique device token for iOS
      const deviceToken = `ios_pwa_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      const { error } = await supabase.from('push_device_tokens').insert({
        user_id: session.user.id,
        platform: 'ios-pwa',
        token_source: 'web',
        platform_details: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          isStandalone: true,
          isIOS: true
        },
        notification_settings: {
          enabled: true,
          task_reminders: true,
          task_updates: true
        },
        token: deviceToken,
        updated_at: new Date().toISOString()
      });
      
      if (error) {
        console.warn('Error saving iOS token, but continuing:', error);
        // We'll continue because we still have the localStorage setting
      } else {
        console.log('✅ iOS PWA token saved successfully');
      }
    }
  } catch (tokenError) {
    // Log but don't throw, as we want to keep the local preference
    console.warn('Failed to save iOS token, but continuing:', tokenError);
  }
  
  // Try to register service worker as a best-effort
  await registerIOSServiceWorker();
  
  toast.success('Notifications enabled for this device', {
    description: 'You will receive task reminders when the app is open'
  });
  
  return true;
}

/**
 * Disables iOS PWA notifications
 * Removes local storage flag and tokens from database
 * @returns Promise resolving to boolean indicating success
 */
export async function disableIOSPWANotifications(): Promise<boolean> {
  console.log('🍎 Disabling iOS PWA notifications');
  
  // Remove local storage preference first
  localStorage.removeItem('ios_pwa_notifications_enabled');
  
  // Try to remove iOS PWA tokens from Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('push_device_tokens')
        .delete()
        .eq('user_id', session.user.id)
        .eq('platform', 'ios-pwa');
    }
  } catch (error) {
    // Just log the error, we've already updated the UI state
    console.warn('Error removing iOS tokens, but continuing:', error);
  }
  
  toast.success('Notifications disabled');
  return true;
}

/**
 * Attempts to register the service worker for iOS
 * This is a best-effort operation that won't block notification setup
 */
async function registerIOSServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('🍎 iOS service worker registered:', registration.scope);
    } catch (swError) {
      console.warn('🍎 iOS service worker registration issue:', swError);
      // Continue anyway - we'll use in-app notifications
    }
  }
}
