
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { detectPlatform } from "@/utils/notifications/platformDetection";
import { useNotifications } from "@/hooks/notifications/use-notifications";

interface UseNotificationToggleProps {
  reminderEnabled: boolean;
  onReminderEnabledChange: (value: boolean) => void;
  onReminderTimeChange: (value: number) => void;
}

export function useNotificationToggle({
  reminderEnabled,
  onReminderEnabledChange,
  onReminderTimeChange,
}: UseNotificationToggleProps) {
  const { isSubscribed, isLoading, enableNotifications } = useNotifications();
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  // Effect for iOS PWA special handling
  useEffect(() => {
    if (isIOSPWA) {
      const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
      if (localEnabled && !reminderEnabled) {
        console.log('🍎 Syncing iOS PWA notification state from localStorage');
        onReminderEnabledChange(true);
      }
    }
  }, [isIOSPWA, reminderEnabled, onReminderEnabledChange]);

  // Improved toggle handler for notifications
  const handleToggle = async (enabled: boolean) => {
    console.log(`🔔 Toggle changed to: ${enabled}`);
    
    if (!enabled) {
      onReminderEnabledChange(false);
      return;
    }

    try {
      // When enabling, always set to "At start time" (0)
      console.log('🔔 Setting default to "At start time" (0)');
      onReminderTimeChange(0);
      
      // Update parent state first
      onReminderEnabledChange(true);
      
      // Now we can do async operations without losing state
      if (isIOSPWA) {
        console.log('🍎 Enabling iOS PWA simplified notifications');
        localStorage.setItem('ios_pwa_notifications_enabled', 'true');
      } else {
        // For non-iOS, request browser permissions as needed
        if ('Notification' in window) {
          try {
            console.log('🔔 Requesting notification permission');
            const permission = await Notification.requestPermission();
            console.log('🔔 Notification permission result:', permission);
            
            if (permission !== 'granted' && !isIOSPWA) {
              console.log('🔔 Permission denied, disabling notifications');
              onReminderEnabledChange(false);
              toast.error('Notification permission denied');
            } else {
              toast.success('Notifications enabled');
            }
          } catch (err) {
            console.warn('🔔 Permission request failed:', err);
            
            if (!isIOSPWA) {
              onReminderEnabledChange(false);
              toast.error('Failed to enable notifications');
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      
      if (isIOSPWA && localStorage.getItem('ios_pwa_notifications_enabled') === 'true') {
        console.log('🍎 Keeping iOS PWA notifications enabled based on local preference');
      } else {
        // Only disable if we're not on iOS PWA with local storage preference
        onReminderEnabledChange(false);
        toast.error('Failed to enable notifications');
      }
    }
  };

  return {
    isLoading,
    isIOSPWA,
    handleToggle
  };
}
