import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { trackUserInteraction } from '@/utils/notifications/soundUtils';

/**
 * iOS PWA specific notification handling
 * Provides functionality for iOS PWA devices where standard web push notifications
 * have limited support.
 */
export function useIOSPWANotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check subscription status specifically for iOS PWA
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Track user interaction for iOS audio playback
      trackUserInteraction();
      
      // First check local storage preference (most reliable for iOS PWA)
      const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
      if (localEnabled) {
        console.log('🍎 iOS PWA notifications enabled in local storage');
        setIsSubscribed(true);
        setIsLoading(false);
        return;
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
          setIsSubscribed(true);
          // Also update local storage to match
          localStorage.setItem('ios_pwa_notifications_enabled', 'true');
        } else {
          console.log('ℹ️ No iOS PWA notification token found, setting subscribed to false');
          setIsSubscribed(false);
          localStorage.removeItem('ios_pwa_notifications_enabled');
        }
      }
    } catch (error) {
      console.error('Error checking iOS PWA subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial check when component mounts
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  async function enableNotifications() {
    try {
      setIsLoading(true);
      console.log('🍎 Setting up iOS PWA notifications');
      
      // Track user interaction for iOS audio playback
      trackUserInteraction();
      
      // Set the local storage flag first for UI consistency
      localStorage.setItem('ios_pwa_notifications_enabled', 'true');
      
      // Set subscribed state immediately for UI responsiveness
      setIsSubscribed(true);
      
      // Try to request permission, but continue whether it succeeds or not
      if ('Notification' in window) {
        try {
          // Add a timeout to prevent hanging
          const permission = await Promise.race([
            Notification.requestPermission(),
            new Promise(resolve => setTimeout(() => resolve('timeout'), 3000))
          ]);
          
          console.log('🍎 iOS notification permission result:', permission);
          
          // Only show guidance if explicitly denied
          if (permission === 'denied') {
            toast.info('Enable notifications in iOS Settings to receive reminders', {
              duration: 6000,
              action: {
                label: 'Learn How',
                onClick: () => window.open('https://support.apple.com/guide/iphone/notifications-iph7c3d96bab/ios', '_blank')
              }
            });
          }
        } catch (err) {
          // Just log the error and continue
          console.warn('🍎 iOS permission request issue, continuing anyway:', err);
        }
      }
      
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
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('🍎 iOS service worker registered:', registration.scope);
        } catch (swError) {
          console.warn('🍎 iOS service worker registration issue:', swError);
          // Continue anyway - we'll use in-app notifications
        }
      }
      
      toast.success('Notifications enabled for this device', {
        description: 'You will receive task reminders when the app is open'
      });
      
      return true;
    } catch (error) {
      console.error('Error enabling iOS PWA notifications:', error);
      
      // If we have local storage set, don't change the UI state
      if (localStorage.getItem('ios_pwa_notifications_enabled') === 'true') {
        console.log('🍎 Keeping iOS PWA notifications enabled based on local preference despite error');
        // We'll keep isSubscribed true despite the error
        return true;
      } else {
        setIsSubscribed(false);
        toast.error(error instanceof Error ? error.message : 'Failed to enable notifications. Please try again.');
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function disableNotifications() {
    try {
      setIsLoading(true);
      console.log('🍎 Disabling iOS PWA notifications');
      
      // Remove local storage preference first
      localStorage.removeItem('ios_pwa_notifications_enabled');
      
      // Update UI state immediately
      setIsSubscribed(false);
      
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
    } catch (error) {
      console.error('Error disabling iOS PWA notifications:', error);
      toast.error('Failed to disable notifications');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isSubscribed,
    isLoading,
    enableNotifications,
    disableNotifications,
    checkSubscriptionStatus
  };
}
