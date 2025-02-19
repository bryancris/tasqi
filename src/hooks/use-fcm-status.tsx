
import { useState, useEffect } from "react";
import { checkNotificationPermission } from "@/utils/notifications/notificationUtils";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { toast } from "@/components/ui/use-toast";

export type FcmStatus = 'loading' | 'ready' | 'error';

export function useFcmStatus() {
  const [fcmStatus, setFcmStatus] = useState<FcmStatus>('loading');

  const checkInitialFcmStatus = async () => {
    try {
      setFcmStatus('loading');
      const hasPermission = await checkNotificationPermission();
      if (!hasPermission) {
        setFcmStatus('error');
        return;
      }
      await setupPushSubscription();
      setFcmStatus('ready');
    } catch (error) {
      console.error('Error checking FCM status:', error);
      setFcmStatus('error');
    }
  };

  const handleReminderToggle = async (enabled: boolean, onReminderEnabledChange: (enabled: boolean) => void) => {
    try {
      if (enabled) {
        setFcmStatus('loading');
        const hasPermission = await checkNotificationPermission();
        if (!hasPermission) {
          setFcmStatus('error');
          throw new Error("Notification permission denied");
        }
        await setupPushSubscription();
        setFcmStatus('ready');
      }
      onReminderEnabledChange(enabled);
    } catch (error) {
      console.error('Error setting up notifications:', error);
      setFcmStatus('error');
      toast({
        title: "Error",
        description: "Failed to set up notifications. Please check browser permissions.",
        variant: "destructive",
      });
      onReminderEnabledChange(false);
    }
  };

  useEffect(() => {
    checkInitialFcmStatus();
  }, []);

  return { fcmStatus, handleReminderToggle };
}
