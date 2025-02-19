
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { checkNotificationPermission } from "@/utils/notifications/notificationUtils";
import { toast } from "sonner";

interface NotificationHandlerProps {
  reminderEnabled: boolean;
  onReminderEnabledChange: (value: boolean) => void;
  onIsScheduledChange: (value: boolean) => void;
}

export const useNotificationHandler = ({
  reminderEnabled,
  onReminderEnabledChange,
  onIsScheduledChange,
}: NotificationHandlerProps) => {
  const handleReminderToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const hasPermission = await checkNotificationPermission();
        if (!hasPermission) {
          throw new Error("Notification permission denied");
        }
        await setupPushSubscription();
      }
      onReminderEnabledChange(enabled);
    } catch (error) {
      console.error('Error setting up notifications:', error);
      toast("Failed to set up notifications. Please check browser permissions.");
      onReminderEnabledChange(false);
    }
  };

  const handleIsScheduledChange = (value: boolean) => {
    if (!value && reminderEnabled) {
      toast("Notifications disabled as task is no longer scheduled");
      onReminderEnabledChange(false);
    }
    onIsScheduledChange(value);
  };

  return {
    handleReminderToggle,
    handleIsScheduledChange,
  };
};
