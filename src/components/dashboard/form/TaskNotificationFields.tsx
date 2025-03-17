
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
import { normalizeReminderTime } from "@/utils/notifications/debug-utils";

interface TaskNotificationFieldsProps {
  reminderEnabled: boolean;
  reminderTime: number;
  fcmStatus: 'loading' | 'ready' | 'error';
  onReminderEnabledChange: (value: boolean) => void;
  onReminderTimeChange: (value: number) => void;
}

// CRITICAL FIX: Define these constant options outside of component
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
  // CRITICAL FIX: Internal state to track display value
  const [internalValue, setInternalValue] = useState<string>(String(reminderTime));
  const { isSubscribed, isLoading, enableNotifications } = useNotifications();
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  // CRITICAL FIX: Enhanced logging to trace values
  console.log(`🚨 FORM TaskNotificationFields rendered with reminderTime=${reminderTime} (type: ${typeof reminderTime}), isExactlyZero: ${reminderTime === 0}`);
  console.log(`🚨 FORM Current internalValue="${internalValue}"`);

  // CRITICAL FIX: Sync internal value with prop
  useEffect(() => {
    // Special handling for exactly 0
    if (reminderTime === 0) {
      console.log('🚨 FORM Setting internalValue to "0" for "At start time"');
      setInternalValue("0");
    } else {
      setInternalValue(String(reminderTime));
    }
  }, [reminderTime]);

  // CRITICAL FIX: Improved toggle handler for notifications
  const handleToggle = async (enabled: boolean) => {
    console.log(`🚨 FORM Toggle changed to: ${enabled}`);
    
    if (!enabled) {
      onReminderEnabledChange(false);
      return;
    }

    try {
      // CRITICAL FIX: When enabling, always set to "At start time" (0)
      console.log('🚨 FORM Setting default to "At start time" (0)');
      onReminderTimeChange(0);
      setInternalValue("0");
      
      // FIXED: Update parent state first
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
          } catch (err) {
            console.warn('🔔 Permission request failed:', err);
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
      }
    }
  };

  // CRITICAL FIX: iOS PWA special handling
  useEffect(() => {
    if (isIOSPWA) {
      const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
      if (localEnabled && !reminderEnabled) {
        console.log('🍎 Syncing iOS PWA notification state from localStorage');
        onReminderEnabledChange(true);
      }
    }
  }, [isIOSPWA, reminderEnabled, onReminderEnabledChange]);

  // CRITICAL FIX: Special handling for time selection
  const handleTimeChange = (value: string) => {
    console.log(`🚨 FORM Time selection changed to: "${value}"`);
    
    // Update internal value immediately for UI responsiveness
    setInternalValue(value);
    
    // Special case for "At start time" (0)
    if (value === "0") {
      console.log('🚨 FORM Selected "At start time", setting parent value to exact 0');
      onReminderTimeChange(0);
      return;
    }
    
    // For other values, parse normally
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      console.log(`🚨 FORM Parsed value ${numValue}, updating parent`);
      onReminderTimeChange(numValue);
    } else {
      console.error(`🚨 FORM Invalid value "${value}", defaulting to 15`);
      onReminderTimeChange(15);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="reminder"
            checked={reminderEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading || fcmStatus === 'loading'}
          />
          <Label htmlFor="reminder" className="flex items-center gap-2">
            Enable notifications
            {(isLoading || fcmStatus === 'loading') && (
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
            onValueChange={handleTimeChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_TIME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
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
