import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { checkIOSPWASubscriptionStatus } from './subscription-utils';
import { enableIOSPWANotifications, disableIOSPWANotifications } from './notification-toggles';

/**
 * Primary hook for iOS PWA specific notification handling
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
      const isEnabled = await checkIOSPWASubscriptionStatus();
      setIsSubscribed(isEnabled);
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

  // Enable notifications with proper state management
  const enableNotifications = async () => {
    try {
      setIsLoading(true);
      const result = await enableIOSPWANotifications();
      setIsSubscribed(true);
      return result;
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
  };

  // Disable notifications with proper state management
  const disableNotifications = async () => {
    try {
      setIsLoading(true);
      const result = await disableIOSPWANotifications();
      setIsSubscribed(false);
      return result;
    } catch (error) {
      console.error('Error disabling iOS PWA notifications:', error);
      toast.error('Failed to disable notifications');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubscribed,
    isLoading,
    enableNotifications,
    disableNotifications,
    checkSubscriptionStatus
  };
}
