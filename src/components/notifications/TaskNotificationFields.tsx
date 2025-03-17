
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

// CRITICAL FIX: Define these constant options outside of component to ensure consistent values
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
  // CRITICAL FIX: Track internal display value state separate from actual reminder time
  const [internalValue, setInternalValue] = useState<string>(String(reminderTime));
  const { isLoading } = useNotifications();
  const platform = detectPlatform();
  const isIOSPWA = platform === 'ios-pwa';

  // CRITICAL FIX: Enhanced logging to track values
  console.log(`🔔 TaskNotificationFields RENDER - reminderTime=${reminderTime} (${typeof reminderTime})`);
  console.log(`🔔 Is AT START TIME? ${reminderTime === 0 ? 'YES' : 'NO'}`);
  console.log(`🔔 Current internalValue="${internalValue}"`);
  
  // CRITICAL FIX: Properly sync the internal state with the prop
  useEffect(() => {
    console.log(`🔔 Effect: syncing from prop reminderTime=${reminderTime} to internalValue`);
    
    // Special handling for exact 0 (At start time)
    if (reminderTime === 0) {
      console.log('🔔 Setting internalValue to "0" for "At start time"');
      setInternalValue("0");
    } else {
      setInternalValue(String(reminderTime));
    }
  }, [reminderTime]);
  
  // CRITICAL FIX: Separated handler for enabling notifications
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

  // CRITICAL FIX: Improved toggle handler
  const handleToggle = async (enabled: boolean) => {
    console.log(`🔔 Toggle changed to: ${enabled}`);
    
    if (!enabled) {
      console.log('🔔 Disabling notifications');
      onReminderEnabledChange(false);
      return;
    }

    try {
      // CRITICAL FIX: When enabling, always default to "At start time" (0)
      // This seems to be the expected behavior - enabling should set AT START TIME
      console.log('🔔 Setting default reminderTime to 0 (At start time)');
      onReminderTimeChange(0);
      setInternalValue("0");
      
      console.log('🔔 Updating parent reminderEnabled to true');
      onReminderEnabledChange(true);
      
      console.log('🔔 Requesting notification permissions');
      const permissionGranted = await handleEnableNotifications();
      
      if (!permissionGranted && !isIOSPWA) {
        console.log('🔔 Permission denied, disabling notifications');
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

  // CRITICAL FIX: Improved handler to properly handle the "At start time" (0) case
  const handleReminderTimeChange = (selectedValue: string) => {
    console.log(`🔔 Selected option value: "${selectedValue}"`);
    
    // Set internal value immediately for UI responsiveness
    setInternalValue(selectedValue);
    
    // Critical special case for "At start time" (0)
    if (selectedValue === "0") {
      console.log('🔔 Processing special "At start time" (0) value');
      onReminderTimeChange(0);
      return;
    }
    
    // For all other values, parse as number
    const numValue = parseInt(selectedValue, 10);
    if (isNaN(numValue)) {
      console.error(`❌ Failed to parse "${selectedValue}" as a number`);
      onReminderTimeChange(15); // Default fallback
      return;
    }
    
    console.log(`🔔 Setting parent reminderTime to ${numValue}`);
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
            value={internalValue}
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
