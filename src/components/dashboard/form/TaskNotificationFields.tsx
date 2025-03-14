
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

  // FIXED: Initialize internalValue directly from the prop with proper string conversion
  const [internalValue, setInternalValue] = useState<string>(() => {
    // Convert reminderTime to string immediately on initialization
    // This prevents flicker and ensures select shows the right value from the start
    const value = reminderTime === 0 ? "0" : String(reminderTime || 0);
    console.log(`⚡ TaskNotificationFields: Initializing with "${value}" from ${reminderTime}`);
    return value;
  });

  // Update internal value when the prop changes (defensive)
  useEffect(() => {
    const stringValue = reminderTime === 0 ? "0" : String(reminderTime || 0);
    console.log(`TaskNotificationFields: Updating internal state to "${stringValue}" from ${reminderTime}`);
    setInternalValue(stringValue);
  }, [reminderTime]);

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
        
        // SIMPLIFIED: Always set to 0 (At start time) when enabling notifications
        console.log('Setting reminder time to 0 (At start time) for iOS');
        onReminderTimeChange(0);
        setInternalValue("0");
        
        if ('Notification' in window) {
          try {
            const permission = await Notification.requestPermission();
            console.log('🍎 iOS notification permission result:', permission);
          } catch (err) {
            console.warn('🍎 iOS permission request failed, but continuing:', err);
          }
        }
      } else {
        await onReminderEnabledChange(true);
        
        // SIMPLIFIED: Always set to 0 (At start time) when enabling notifications
        console.log('Setting reminder time to 0 (At start time)');
        onReminderTimeChange(0);
        setInternalValue("0");
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
            value={internalValue}
            onValueChange={(value) => {
              setInternalValue(value);
              // Directly parse the value to a number - always safe with our defined options
              const numValue = Number(value);
              console.log(`Select changed to: "${value}" → ${numValue}`);
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
