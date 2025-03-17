
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
import { useEffect } from "react";
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
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  // CRITICAL FIX: Enhanced logging to trace the exact value of reminderTime
  console.log(`🚨 TaskNotificationFields rendered with reminderTime=${reminderTime} (type: ${typeof reminderTime}), isExactlyZero: ${reminderTime === 0}`);

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      onReminderEnabledChange(false);
      return;
    }

    try {
      // CRITICAL FIX: Always set reminderTime to 0 IMMEDIATELY before any async operations
      console.log('🚨 Setting reminderTime to 0 BEFORE any async operations');
      onReminderTimeChange(0);
      
      // CRITICAL FIX: Also update the enabled state immediately for better UI responsiveness
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

  useEffect(() => {
    if (isIOSPWA) {
      const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
      if (localEnabled && !reminderEnabled) {
        console.log('🍎 Syncing iOS PWA notification state from localStorage');
        
        // CRITICAL FIX: Set reminderTime to 0 first, then enable notifications
        onReminderTimeChange(0);
        onReminderEnabledChange(true);
      }
    }
  }, [isIOSPWA, reminderEnabled, onReminderEnabledChange, onReminderTimeChange]);

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
            value={String(reminderTime)} // Always convert to string for Select
            onValueChange={(value) => {
              // CRITICAL FIX: Use our normalizer to ensure consistent handling
              const normalizedValue = normalizeReminderTime(value);
              console.log(`🚨 Select changed to: "${value}" → normalized to ${normalizedValue} (${typeof normalizedValue})`);
              onReminderTimeChange(normalizedValue);
            }}
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
