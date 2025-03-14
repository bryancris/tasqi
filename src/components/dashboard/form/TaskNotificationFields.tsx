
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/notifications/use-notifications";
import { detectPlatform } from "@/utils/notifications/platformDetection";

interface TaskNotificationFieldsProps {
  reminderEnabled: boolean;
  reminderTime: number;
  fcmStatus: 'loading' | 'ready' | 'error';
  onReminderEnabledChange: (value: boolean) => void;
  onReminderTimeChange: (value: number) => void;
}

const REMINDER_TIME_OPTIONS = [
  { value: 0, label: 'At start time' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
];

export function TaskNotificationFields({
  reminderEnabled,
  reminderTime,
  fcmStatus,
  onReminderEnabledChange,
  onReminderTimeChange,
}: TaskNotificationFieldsProps) {
  const { isSubscribed, isLoading, enableNotifications } = useNotifications();
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  // Debug log on component mount and reminderTime changes
  useEffect(() => {
    // Explicitly log the exact value and type to help debugging
    console.log(`TaskNotificationFields: Raw reminderTime = ${reminderTime} (${typeof reminderTime})`);

    // Force a value conversion check to catch any edge cases
    const numericValue = typeof reminderTime === 'number' ? reminderTime : Number(reminderTime || 0);
    console.log(`TaskNotificationFields: Computed numericValue = ${numericValue}`);
    
    // Log what value the select will use - critical for debugging Select issues
    const selectValue = reminderTime === 0 ? "0" : reminderTime?.toString() || "0";
    console.log(`TaskNotificationFields: Select value will be "${selectValue}"`);
  }, [reminderTime]);

  // Safety check to ensure reminder_time is always the right type
  useEffect(() => {
    // Only run this if component is mounted and reminder is enabled
    if (reminderEnabled) {
      if (reminderTime === undefined || reminderTime === null) {
        console.log('🛠️ Setting default reminder time to 0 (At start time) - null/undefined detected');
        onReminderTimeChange(0);
      } else if (typeof reminderTime !== 'number') {
        console.log(`🛠️ Converting non-number reminder time ${reminderTime} (${typeof reminderTime}) to number`);
        const numValue = reminderTime === '0' ? 0 : Number(reminderTime) || 0;
        onReminderTimeChange(numValue);
      }
    }
  }, [reminderEnabled, reminderTime, onReminderTimeChange]);

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      onReminderEnabledChange(false);
      return;
    }

    setLocalIsLoading(true);
    
    try {
      if (isIOSPWA) {
        console.log('🍎 Enabling iOS PWA simplified notifications');
        
        localStorage.setItem('ios_pwa_notifications_enabled', 'true');
        
        onReminderEnabledChange(true);
        
        // Set default reminder time to "At start time" if none selected
        if (reminderTime === undefined) {
          console.log('Setting reminder time to 0 (At start time) for iOS');
          onReminderTimeChange(0);
        } else if (typeof reminderTime !== 'number') {
          console.log(`Converting iOS reminder time ${reminderTime} (${typeof reminderTime}) to number`);
          // FIX: Ensure 0 values are preserved, not converted to default
          const numValue = reminderTime === '0' ? 0 : Number(reminderTime) || 0;
          onReminderTimeChange(numValue);
        }
        
        if ('Notification' in window) {
          try {
            const permission = await Notification.requestPermission();
            console.log('🍎 iOS notification permission result:', permission);
          } catch (err) {
            console.warn('🍎 iOS permission request failed, but continuing:', err);
          }
        }
        
        await onReminderEnabledChange(true);
      } else {
        await onReminderEnabledChange(true);
        
        // Set default reminder time to "At start time" if none selected
        if (reminderTime === undefined) {
          console.log('Setting reminder time to 0 (At start time)');
          onReminderTimeChange(0);
        } else if (typeof reminderTime !== 'number') {
          console.log(`Converting reminder time ${reminderTime} (${typeof reminderTime}) to number`);
          // FIX: Ensure 0 values are preserved, not converted to default
          const numValue = reminderTime === '0' ? 0 : Number(reminderTime) || 0;
          onReminderTimeChange(numValue);
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      
      if (isIOSPWA && localStorage.getItem('ios_pwa_notifications_enabled') === 'true') {
        console.log('🍎 Keeping iOS PWA notifications enabled based on local preference');
      } else {
        onReminderEnabledChange(false);
      }
    } finally {
      setLocalIsLoading(false);
    }
  };

  useEffect(() => {
    if (isIOSPWA) {
      const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
      if (localEnabled && !reminderEnabled) {
        console.log('🍎 Syncing iOS PWA notification state from localStorage');
        onReminderEnabledChange(true);
      }
    }
  }, [isIOSPWA, reminderEnabled, onReminderEnabledChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="reminder"
            checked={reminderEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading || localIsLoading || fcmStatus === 'loading'}
          />
          <Label htmlFor="reminder" className="flex items-center gap-2">
            Enable notifications
            {(isLoading || localIsLoading || fcmStatus === 'loading') && (
              <Spinner className="w-4 h-4" />
            )}
          </Label>
        </div>
      </div>

      {reminderEnabled && (
        <div className="flex items-center space-x-2">
          <Label htmlFor="reminderTime">Notify me</Label>
          <Select
            // IMPORTANT: Special handling for zero values
            value={reminderTime === 0 ? "0" : reminderTime?.toString() || "0"}
            onValueChange={(value) => {
              // Convert the string value to a number
              const numValue = Number(value);
              console.log(`🛠️ Select changed to: "${value}" → ${numValue} (${typeof numValue})`);
              onReminderTimeChange(numValue);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isIOSPWA && reminderEnabled && (
        <div className="text-xs text-amber-600 mt-1">
          Note: iOS notifications work best when the app is open or in recent background apps
        </div>
      )}
    </div>
  );
}
