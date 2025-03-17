
import { useNotificationToggle } from "./hooks/useNotificationToggle";
import { useReminderTimeSelection } from "./hooks/useReminderTimeSelection";
import { NotificationToggle } from "./components/NotificationToggle";
import { ReminderTimeSelector } from "./components/ReminderTimeSelector";
import { IOSPWANotice } from "./components/IOSPWANotice";
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

  // Enhanced logging to track values in the parent component
  console.log(`🔔 TaskNotificationFields RENDER - reminderTime=${reminderTime} (${typeof reminderTime})`);
  console.log(`🔔 Is AT START TIME? ${reminderTime === 0 ? 'YES' : 'NO'}`);

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
