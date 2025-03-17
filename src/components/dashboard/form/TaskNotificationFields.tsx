
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

  // CRITICAL FIX: Always use the parent's reminderTime value directly
  console.log(`🔥 TaskNotificationFields rendered with reminderTime=${reminderTime} (${typeof reminderTime})`);

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      onReminderEnabledChange(false);
      return;
    }

    try {
      // CRITICAL FIX: Set reminderTime to 0 FIRST, before any async operations
      console.log('Setting reminder time to 0 (At start time) BEFORE async operations');
      onReminderTimeChange(0);
      
      if (isIOSPWA) {
        console.log('🍎 Enabling iOS PWA simplified notifications');
        localStorage.setItem('ios_pwa_notifications_enabled', 'true');
        onReminderEnabledChange(true);
      } else {
        // Enable notifications AFTER setting reminderTime
        // This fixes the race condition where the reminderTime was getting lost
        onReminderEnabledChange(true);
      }
      
      // Now we can do the async operations, the state is already updated
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          console.log('Notification permission result:', permission);
        } catch (err) {
          console.warn('Permission request failed, but continuing:', err);
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      
      if (isIOSPWA && localStorage.getItem('ios_pwa_notifications_enabled') === 'true') {
        console.log('🍎 Keeping iOS PWA notifications enabled based on local preference');
      } else {
        onReminderEnabledChange(false);
      }
    }
  };

  useEffect(() => {
    if (isIOSPWA) {
      const localEnabled = localStorage.getItem('ios_pwa_notifications_enabled') === 'true';
      if (localEnabled && !reminderEnabled) {
        console.log('🍎 Syncing iOS PWA notification state from localStorage');
        onReminderEnabledChange(true);
        
        // CRITICAL FIX: Also set reminderTime to 0 when syncing state from localStorage
        onReminderTimeChange(0);
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
            value={String(reminderTime)} // CRITICAL FIX: Always convert to string for Select
            onValueChange={(value) => {
              // CRITICAL FIX: Convert string to number immediately
              const numValue = Number(value);
              console.log(`Select changed to: "${value}" → ${numValue} (type: ${typeof numValue})`);
              
              // Call parent handler with number value
              onReminderTimeChange(numValue);
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
