
import { useState, useEffect, useCallback } from 'react';
import { detectPlatform } from '@/utils/notifications/platformDetection';
import { useIOSPWANotifications } from './use-ios-pwa-notifications';
import { useWebNotifications } from './use-web-notifications';

/**
 * Platform-adaptive notifications hook
 * Automatically selects the appropriate notification implementation
 * based on the detected platform (iOS PWA or standard web)
 */
export function useNotifications() {
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';
  
  // Use the platform-specific hooks
  const iosPwaNotifications = useIOSPWANotifications();
  const webNotifications = useWebNotifications();
  
  // Track combined state for last enable attempt
  const [lastEnableAttempt, setLastEnableAttempt] = useState(0);
  
  // Select the appropriate implementation based on platform
  const implementation = isIOSPWA ? iosPwaNotifications : webNotifications;
  
  // Re-check subscription status after each enable attempt with a delay
  useEffect(() => {
    if (lastEnableAttempt > 0) {
      // Add a slight delay to allow the backend operation to complete
      const timeoutId = setTimeout(() => {
        implementation.checkSubscriptionStatus();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [lastEnableAttempt, implementation]);
  
  // Wrap the enable/disable functions to track attempts
  const enableNotifications = async () => {
    try {
      const result = await implementation.enableNotifications();
      setLastEnableAttempt(Date.now());
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  const disableNotifications = async () => {
    try {
      const result = await implementation.disableNotifications();
      setLastEnableAttempt(Date.now());
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  return {
    isSubscribed: implementation.isSubscribed,
    isLoading: implementation.isLoading,
    enableNotifications,
    disableNotifications,
    checkSubscriptionStatus: implementation.checkSubscriptionStatus
  };
}
