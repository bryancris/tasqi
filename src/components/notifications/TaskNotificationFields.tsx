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
import { toast } from "sonner";

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
  const [displayValue, setDisplayValue] = useState<string>(String(reminderTime));
  const { isLoading } = useNotifications();
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  console.log(`🔴 TaskNotificationFields rendered with reminderTime=${reminderTime} (${typeof reminderTime})`);
  console.log(`🔴 Is exactly zero? ${reminderTime === 0 ? 'YES - AT START TIME' : 'NO'}`);
  
  useEffect(() => {
    console.log(`🔴 Effect: updating display value from ${reminderTime} to ${String(reminderTime)}`);
    setDisplayValue(String(reminderTime));
  }, [reminderTime]);
  
  const handleEnableNotifications = async (): Promise<boolean> => {
    try {
      if (isIOSPWA) {
        console.log('🍎 Enabling iOS PWA simplified notifications');
        localStorage.setItem('ios_pwa_notifications_enabled', 'true');
        return true;
      }
      
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('🔔 Notification permission result:', permission);
        return permission === 'granted';
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      return false;
    }
  };

  const handleToggle = async (enabled: boolean) => {
    console.log(`🔴 Toggle changed to: ${enabled}`);
    
    if (!enabled) {
      console.log('🔴 Disabling notifications');
      onReminderEnabledChange(false);
      return;
    }

    try {
      const defaultValue = 0;
      console.log(`🔴 Setting default reminderTime to ${defaultValue} (At start time)`);
      onReminderTimeChange(defaultValue);
      
      console.log('🔴 Updating parent reminderEnabled to true');
      onReminderEnabledChange(true);
      
      console.log('🔴 Requesting notification permissions');
      const permissionGranted = await handleEnableNotifications();
      
      if (!permissionGranted && !isIOSPWA) {
        console.log('🔴 Permission denied, disabling notifications');
        onReminderEnabledChange(false);
        toast.error('Notification permission denied');
      } else {
        toast.success('Notifications enabled');
      }
    } catch (error) {
      console.error('❌ Unexpected error in toggle handler:', error);
      if (isIOSPWA && localStorage.getItem('ios_pwa_notifications_enabled') === 'true') {
        console.log('🍎 Keeping iOS PWA notifications enabled based on local preference');
      } else {
        onReminderEnabledChange(false);
        toast.error('Failed to enable notifications');
      }
    }
  };

  const handleReminderTimeChange = (selectedValue: string) => {
    if (selectedValue === "0") {
      console.log(`🔴 Selected "At start time" (0) exactly`);
      setDisplayValue("0");
      onReminderTimeChange(0);
      return;
    }
    
    const numValue = parseInt(selectedValue, 10);
    console.log(`🔴 Selected time "${selectedValue}" → parsed as ${numValue} (${typeof numValue})`);
    if (isNaN(numValue)) {
      console.error(`❌ Failed to parse "${selectedValue}" as a number`);
      return;
    }
    
    setDisplayValue(selectedValue);
    console.log(`🔴 Updating parent reminderTime to ${numValue}`);
    onReminderTimeChange(numValue);
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
            value={displayValue}
            onValueChange={handleReminderTimeChange}
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
