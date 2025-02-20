
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

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
  // Reset the toggle if there's an error
  useEffect(() => {
    if (fcmStatus === 'error' && reminderEnabled) {
      onReminderEnabledChange(false);
    }
  }, [fcmStatus, reminderEnabled, onReminderEnabledChange]);

  const handleToggle = async (enabled: boolean) => {
    if (!('Notification' in window)) {
      toast.error("Your browser doesn't support notifications");
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error("Please enable notifications in your browser settings", {
        duration: 5000,
        action: {
          label: "How to enable",
          onClick: () => {
            window.open('https://support.google.com/chrome/answer/3220216?hl=en', '_blank');
          }
        }
      });
      return;
    }

    onReminderEnabledChange(enabled);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="reminder"
            checked={reminderEnabled}
            onCheckedChange={handleToggle}
            disabled={fcmStatus === 'loading'}
          />
          <Label htmlFor="reminder" className="flex items-center gap-2">
            Enable notifications
            {fcmStatus === 'loading' && (
              <Spinner className="w-4 h-4" />
            )}
          </Label>
        </div>
      </div>

      {reminderEnabled && fcmStatus === 'ready' && (
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
