
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
import { useNotifications } from "../notifications/NotificationsManager";

interface TaskNotificationFieldsProps {
  reminderEnabled: boolean;
  reminderTime: number;
  fcmStatus: 'loading' | 'ready' | 'error';
  onReminderEnabledChange: (value: boolean) => void;
  onReminderTimeChange: (value: number) => void;
}

const REMINDER_TIME_OPTIONS = [
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
  const [localEnabled, setLocalEnabled] = useState(reminderEnabled);

  // Sync local state with prop
  useEffect(() => {
    setLocalEnabled(reminderEnabled);
  }, [reminderEnabled]);

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setLocalEnabled(false);
      onReminderEnabledChange(false);
      return;
    }

    try {
      if (!isSubscribed) {
        await enableNotifications();
      }
      setLocalEnabled(true);
      onReminderEnabledChange(true);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setLocalEnabled(false);
      onReminderEnabledChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="reminder"
            checked={localEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
          <Label htmlFor="reminder" className="flex items-center gap-2">
            Enable notifications
            {isLoading && (
              <Spinner className="w-4 h-4" />
            )}
          </Label>
        </div>
      </div>

      {localEnabled && isSubscribed && (
        <div className="flex items-center space-x-2">
          <Label htmlFor="reminderTime">Notify me</Label>
          <Select
            value={reminderTime.toString()}
            onValueChange={(value) => onReminderTimeChange(Number(value))}
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
    </div>
  );
}
