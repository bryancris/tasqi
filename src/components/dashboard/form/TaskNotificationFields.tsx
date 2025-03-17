
import { useNotificationToggle } from "@/components/notifications/hooks/useNotificationToggle";
import { useReminderTimeSelection } from "@/components/notifications/hooks/useReminderTimeSelection";
import { NotificationToggle } from "@/components/notifications/components/NotificationToggle";
import { ReminderTimeSelector } from "@/components/notifications/components/ReminderTimeSelector";
import { IOSPWANotice } from "@/components/notifications/components/IOSPWANotice";
import { detectPlatform } from "@/utils/notifications/platformDetection";

interface TaskNotificationFieldsProps {
  reminderEnabled: boolean;
  reminderTime: number;
  fcmStatus: 'loading' | 'ready' | 'error';
  onReminderEnabledChange: (value: boolean) => void;
  onReminderTimeChange: (value: number) => void;
}

export function TaskNotificationFields({
  reminderEnabled,
  reminderTime,
  fcmStatus,
  onReminderEnabledChange,
  onReminderTimeChange,
}: TaskNotificationFieldsProps) {
  // Use our custom hooks to handle logic
  const { isLoading, isIOSPWA, handleToggle } = useNotificationToggle({
    reminderEnabled,
    onReminderEnabledChange,
    onReminderTimeChange
  });
  
  const { internalValue, handleTimeChange } = useReminderTimeSelection({
    reminderTime,
    onReminderTimeChange
  });

  // CRITICAL FIX: Enhanced logging to track values
  console.log(`🚨 FORM TaskNotificationFields rendered with reminderTime=${reminderTime} (type: ${typeof reminderTime}), isExactlyZero: ${reminderTime === 0}`);
  console.log(`🚨 FORM Current internalValue="${internalValue}"`);

  return (
    <div className="space-y-4">
      <NotificationToggle 
        reminderEnabled={reminderEnabled}
        isLoading={isLoading}
        fcmStatus={fcmStatus}
        onToggle={handleToggle}
      />

      {reminderEnabled && (
        <ReminderTimeSelector
          value={internalValue}
          onValueChange={handleTimeChange}
        />
      )}

      <IOSPWANotice show={isIOSPWA && reminderEnabled} />
    </div>
  );
}
