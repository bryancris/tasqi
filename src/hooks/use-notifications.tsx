
import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/utils/notifications/notificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { detectPlatform } from '@/utils/notifications/platformDetection';

export function useNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastEnableAttempt, setLastEnableAttempt] = useState(0);
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  // Check subscription status with debounce for iOS PWA
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // For iOS PWA, we need a different approach to check subscription
      if (isIOSPWA) {
        console.log('🍎 Checking iOS PWA subscription status');
        // Check if we have a stored token for this device
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
          } else {
            console.log('ℹ️ No iOS PWA notification token found, setting subscribed to false');
            setIsSubscribed(false);
          }
        }
      } else {
        // Standard web approach
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            console.log('✅ Web push subscription found');
            setIsSubscribed(true);
          } else {
            console.log('ℹ️ No web push subscription found');
            setIsSubscribed(false);
          }
        } catch (err) {
          console.error('Error checking push subscription:', err);
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [isIOSPWA]);

  // Initial check when component mounts
  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  // Re-check subscription status after each enable attempt with a delay
  // This is crucial for iOS PWA where the token might take a moment to register
  useEffect(() => {
    if (lastEnableAttempt > 0) {
      // Add a slight delay to allow the backend operation to complete
      const timeoutId = setTimeout(() => {
        checkSubscriptionStatus();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [lastEnableAttempt, checkSubscriptionStatus]);

  async function enableNotifications() {
    try {
      setIsLoading(true);
      console.log(`🔔 Enabling notifications for platform: ${platform}`);
      
      // Special handling for iOS PWA
      if (isIOSPWA) {
        console.log('🍎 Setting up iOS PWA notifications');
        
        // For iOS PWA, we need to first request permission
        if ('Notification' in window) {
          let permissionResult;
          
          try {
            permissionResult = await Notification.requestPermission();
          } catch (err) {
            console.warn('🍎 iOS permission request failed, trying alternative approach:', err);
            
            // Some iOS versions have issues with the promise-based API
            // Fallback to the older callback-based API
            permissionResult = await new Promise((resolve) => {
              Notification.requestPermission((result) => {
                resolve(result);
              });
            });
          }
          
          console.log('🍎 iOS notification permission result:', permissionResult);
          
          if (permissionResult !== 'granted') {
            // Show iOS-specific guidance for enabling notifications
            toast.error('Please enable notifications in your iOS Settings', {
              duration: 10000,
              action: {
                label: 'Learn How',
                onClick: () => window.open('https://support.apple.com/guide/iphone/notifications-iph7c3d96bab/ios', '_blank')
              }
            });
            throw new Error('Notification permission denied');
          }
        }
        
        // Generate and save a device token for this iOS PWA
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast.error('You must be logged in to enable notifications');
          throw new Error('User not logged in');
        }
        
        // Generate a unique device token for iOS
        const deviceToken = `ios_pwa_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        
        // Save the token to Supabase
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
          console.error('Error saving iOS token:', error);
          toast.error('Failed to save notification settings');
          throw error;
        }
        
        // Register the service worker if possible (for future support)
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            console.log('🍎 iOS service worker registered:', registration.scope);
            
            // Tell the service worker we want notifications
            if (registration.active) {
              registration.active.postMessage({
                type: 'INIT_IOS_NOTIFICATIONS',
                token: deviceToken
              });
            }
          } catch (swError) {
            console.warn('🍎 iOS service worker registration issue:', swError);
            // Continue anyway - we'll use in-app notifications
          }
        }
        
        console.log('✅ iOS PWA notifications enabled successfully!');
        // CRITICAL: Set isSubscribed to true immediately for UI responsiveness
        setIsSubscribed(true);
        
        toast.success('Notifications enabled for this device', {
          description: 'Keep the app active to receive notifications'
        });
        
      } else {
        // Standard web notifications setup
        console.log('🌐 Setting up standard web notifications');
        await notificationService.initialize();
        const subscription = await notificationService.subscribe();
        
        if (subscription) {
          console.log('✅ Web notifications enabled successfully!');
          // CRITICAL: Set isSubscribed to true immediately for UI responsiveness
          setIsSubscribed(true);
          toast.success('Notifications enabled successfully');
        } else {
          throw new Error('Failed to create notification subscription');
        }
      }
      
      // Record this attempt to trigger the re-check effect
      setLastEnableAttempt(Date.now());
      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enable notifications. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function disableNotifications() {
    try {
      setIsLoading(true);
      
      // Special handling for iOS PWA
      if (isIOSPWA) {
        console.log('🍎 Disabling iOS PWA notifications');
        
        // Remove iOS PWA tokens from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error } = await supabase
            .from('push_device_tokens')
            .delete()
            .eq('user_id', session.user.id)
            .eq('platform', 'ios-pwa');
            
          if (error) {
            console.error('Error removing iOS tokens:', error);
            throw error;
          }
        }
        
        setIsSubscribed(false);
        toast.success('Notifications disabled');
      } else {
        // Standard web approach
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          
          if (subscription) {
            await subscription.unsubscribe();
            
            // Remove subscription from Supabase
            const { error } = await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
              
            if (error) throw error;
            
            setIsSubscribed(false);
            toast.success('Notifications disabled');
          }
        } catch (error) {
          console.error('Error unsubscribing from push:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
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
