
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TaskNotificationFieldsProps {
  reminderEnabled: boolean;
  reminderTime: number;
  isScheduled: boolean;
  onReminderEnabledChange: (value: boolean) => void;
  onReminderTimeChange: (value: number) => void;
  onIsScheduledChange: (value: boolean) => void;
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
  isScheduled,
  onReminderEnabledChange,
  onReminderTimeChange,
  onIsScheduledChange,
}: TaskNotificationFieldsProps) {
  const handleReminderToggle = (enabled: boolean) => {
    if (enabled && !isScheduled) {
      // Automatically enable scheduling when notifications are turned on
      onIsScheduledChange(true);
      onReminderEnabledChange(enabled);
      toast.info("Task scheduling enabled for notifications");
    } else {
      onReminderEnabledChange(enabled);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="reminder"
              checked={reminderEnabled}
              onCheckedChange={handleReminderToggle}
              disabled={!isScheduled}
            />
            <Label htmlFor="reminder">Enable notifications</Label>
          </div>
          {!isScheduled && (
            <p className="text-sm text-muted-foreground">
              Schedule the task to enable notifications
            </p>
          )}
        </div>
      </div>

      {reminderEnabled && (
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
