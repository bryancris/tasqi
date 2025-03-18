
import { useState, useEffect, useCallback } from 'react';
import { detectPlatform } from '@/utils/notifications/platformDetection';
import { useIOSPWANotifications } from './use-ios-pwa-notifications';
import { useWebNotifications } from './use-web-notifications';
import { useNotifications as useNotificationsContext } from '@/components/notifications/context/NotificationsContext';

/**
 * Hook: useNotifications
 * 
 * Purpose:
 * - Platform-adaptive notification hook that works on different environments
 * - Detects platform (iOS PWA vs standard web) and uses appropriate implementation
 * - Provides unified interface for enabling, disabling, and showing notifications
 * 
 * Important Notes:
 * - This is the main hook imported by components that need to show notifications
 * - It uses platform-specific implementations under the hood
 * - The showNotification method is the primary way to create notifications
 * 
 * Example Usage:
 * const { showNotification, isSubscribed, enableNotifications } = useNotifications();
 * showNotification({ 
 *   title: 'Task Reminder', 
 *   message: 'Complete your task',
 *   referenceId: '123',
 *   referenceType: 'task' 
 * });
 */

export function useNotifications() {
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';
  
  const iosPwaNotifications = useIOSPWANotifications();
  const webNotifications = useWebNotifications();
  
  const [lastEnableAttempt, setLastEnableAttempt] = useState(0);
  
  const implementation = isIOSPWA ? iosPwaNotifications : webNotifications;
  
  const notificationContext = useNotificationsContext();
  
  useEffect(() => {
    if (lastEnableAttempt > 0) {
      const timeoutId = setTimeout(() => {
        implementation.checkSubscriptionStatus();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [lastEnableAttempt, implementation]);
  
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
  
  // Wrap the original showNotification to ensure it returns a boolean
  const wrappedShowNotification = async (params: Parameters<typeof notificationContext.showNotification>[0]): Promise<boolean> => {
    try {
      const result = await notificationContext.showNotification(params);
      // Ensure we return a boolean value
      return result === true;
    } catch (error) {
      console.error('Error in wrapped showNotification:', error);
      return false;
    }
  };
  
  return {
    isSubscribed: implementation.isSubscribed,
    isLoading: implementation.isLoading,
    enableNotifications,
    disableNotifications,
    checkSubscriptionStatus: implementation.checkSubscriptionStatus,
    showNotification: wrappedShowNotification
  };
}
