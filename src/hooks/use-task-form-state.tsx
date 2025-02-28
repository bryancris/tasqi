import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNotifications } from "@/hooks/notifications/use-notifications";
import { detectPlatform } from "@/utils/notifications/platformDetection";

export function useTaskFormState({
  reminderEnabled,
  onReminderEnabledChange
}: {
  reminderEnabled: boolean;
  onReminderEnabledChange: (value: boolean) => void;
}) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [fcmStatus, setFcmStatus] = useState<'loading' | 'ready' | 'error'>('ready');
  const { isSubscribed, isLoading: notificationsLoading, enableNotifications } = useNotifications();
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  // Check for iOS PWA local storage preference on mount
  useEffect(() => {
    if (isIOSPWA) {
      const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
      if (localEnabled && !reminderEnabled) {
        console.log('🍎 Setting reminder enabled from localStorage');
        onReminderEnabledChange(true);
      }
    }
  }, [isIOSPWA, reminderEnabled, onReminderEnabledChange]);

  // For non-iOS platforms, synchronize with standard notification subscription
  useEffect(() => {
    if (!isIOSPWA && isSubscribed && !reminderEnabled && !notificationsLoading && fcmStatus !== 'loading') {
      console.log('Syncing reminder state: notifications are subscribed but reminder is disabled');
      onReminderEnabledChange(true);
    }
  }, [isIOSPWA, isSubscribed, reminderEnabled, notificationsLoading, fcmStatus, onReminderEnabledChange]);

  const handleReminderToggle = async (enabled: boolean) => {
    try {
      if (!enabled) {
        // Turning notifications off is simple
        if (isIOSPWA) {
          // For iOS PWA, immediately remove local storage preference
          localStorage.removeItem('ios_pwa_notifications_enabled');
        }
        
        // Update UI immediately
        onReminderEnabledChange(false);
        
        // Attempt to disable notifications in the background
        try {
          await enableNotifications();
        } catch (error) {
          console.warn('Error disabling notifications, but UI already updated:', error);
        }
        
        return;
      }
      
      // Turning notifications on
      setFcmStatus('loading');
      
      if (isIOSPWA) {
        // For iOS PWA, set local storage immediately
        localStorage.setItem('ios_pwa_notifications_enabled', 'true');
        
        // Update UI immediately for better responsiveness
        onReminderEnabledChange(true);
      }
      
      // Try to enable notifications through the service
      try {
        await enableNotifications();
        
        // Always ensure UI is enabled after success
        onReminderEnabledChange(true);
        setFcmStatus('ready');
        
        // For iOS PWA, show success with platform-specific message
        if (isIOSPWA) {
          toast({
            title: "Notifications Enabled",
            description: "You'll receive notifications when the app is open or in recent apps",
          });
        } else {
          toast({
            title: "Success",
            description: "Notifications enabled successfully",
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
        
        if (isIOSPWA) {
          // For iOS PWA, we'll keep the UI enabled despite the error
          // because we're using localStorage as the source of truth
          toast({
            title: "Partial Success",
            description: "Notifications available when app is open. Some browser features may be limited.",
          });
          setFcmStatus('ready');
        } else {
          // For other platforms, reflect the error state
          setFcmStatus('error');
          onReminderEnabledChange(false);
          
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : 'Failed to setup notifications. Please check browser permissions.',
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error handling reminder toggle:', error);
      
      // For iOS PWA, keep the toggle on if we have local storage set
      if (isIOSPWA && localStorage.getItem('ios_pwa_notifications_enabled') === 'true') {
        // Keep the UI state as-is
        setFcmStatus('ready');
      } else {
        // For other errors, reset state
        setFcmStatus('error');
        onReminderEnabledChange(false);
      }
    }
  };

  return {
    showShareDialog,
    setShowShareDialog,
    fcmStatus,
    notificationsLoading,
    isIOSPWA,
    handleReminderToggle
  };
}
