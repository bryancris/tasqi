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

  // Check subscription status with different strategies for different platforms
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // For iOS PWA, check both stored token and local preference
      if (isIOSPWA) {
        console.log('🍎 Checking iOS PWA subscription status');
        
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
      } else {
        // Standard web approach for non-iOS platforms
        try {
          // First try service worker subscription
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
              console.log('✅ Web push subscription found');
              setIsSubscribed(true);
              setIsLoading(false);
              return;
            }
          }
          
          // As a fallback, check the database
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: subs, error } = await supabase
              .from('push_subscriptions')
              .select('id')
              .eq('user_id', session.user.id)
              .limit(1);
              
            if (!error && subs && subs.length > 0) {
              console.log('✅ Push subscription found in database');
              setIsSubscribed(true);
            } else {
              console.log('ℹ️ No push subscription found');
              setIsSubscribed(false);
            }
          } else {
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
        
        // For iOS PWA, we'll set the local storage flag first for UI consistency
        localStorage.setItem('ios_pwa_notifications_enabled', 'true');
        
        // Set subscribed state immediately for UI responsiveness
        setIsSubscribed(true);
        
        // For iOS PWA, we have a simpler flow that doesn't depend on system permissions
        // We'll still try to request permission, but we'll continue whether it succeeds or not
        if ('Notification' in window) {
          try {
            // Try to request permission, but don't throw if it fails
            const permission = await Promise.race([
              Notification.requestPermission(),
              // Add a timeout to prevent hanging
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
        
        // Attempt to save a device token for this iOS PWA
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
      } else {
        // Standard web notifications setup for non-iOS platforms
        console.log('🌐 Setting up standard web notifications');
        
        // Initialize notification service
        await notificationService.initialize();
        
        // Try to subscribe
        const subscription = await notificationService.subscribe();
        
        if (subscription) {
          console.log('✅ Web notifications enabled successfully!');
          setIsSubscribed(true);
          toast.success('Notifications enabled successfully');
          return true;
        } else {
          throw new Error('Failed to create notification subscription');
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      
      // For iOS PWA, if we have local storage set, don't change the UI state
      if (isIOSPWA && localStorage.getItem('ios_pwa_notifications_enabled') === 'true') {
        console.log('🍎 Keeping iOS PWA notifications enabled based on local preference despite error');
        // We'll keep isSubscribed true despite the error
        return true;
      } else {
        // For standard platforms or if no local preference, show error and reset state
        setIsSubscribed(false);
        toast.error(error instanceof Error ? error.message : 'Failed to enable notifications. Please try again.');
        throw error;
      }
    } finally {
      // Record this attempt to trigger the re-check effect
      setLastEnableAttempt(Date.now());
      setIsLoading(false);
    }
  }

  async function disableNotifications() {
    try {
      setIsLoading(true);
      
      // Special handling for iOS PWA
      if (isIOSPWA) {
        console.log('🍎 Disabling iOS PWA notifications');
        
        // Remove local storage preference first
        localStorage.removeItem('ios_pwa_notifications_enabled');
        
        // Update UI state immediately
        setIsSubscribed(false);
        
        // Try to remove iOS PWA tokens from Supabase as a best effort
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
      } else {
        // Standard web approach for non-iOS
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
              await subscription.unsubscribe();
              
              // Also try to remove subscription from Supabase
              try {
                const { error } = await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('endpoint', subscription.endpoint);
                  
                if (error) console.warn('Error removing subscription from database:', error);
              } catch (error) {
                console.warn('Error in database operation:', error);
              }
            }
            
            setIsSubscribed(false);
            toast.success('Notifications disabled');
            return true;
          } catch (error) {
            console.error('Error unsubscribing from push:', error);
            throw error;
          }
        } else {
          // If service worker isn't available, just update the UI
          setIsSubscribed(false);
          toast.success('Notifications disabled');
          return true;
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
