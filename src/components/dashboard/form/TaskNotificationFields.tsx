
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TaskNotificationFieldsProps {
  reminderEnabled: boolean;
  onReminderEnabledChange: (value: boolean) => void;
}

export function TaskNotificationFields({
  reminderEnabled,
  onReminderEnabledChange,
}: TaskNotificationFieldsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Switch
          id="reminder"
          checked={reminderEnabled}
          onCheckedChange={onReminderEnabledChange}
        />
        <Label htmlFor="reminder">Enable notifications</Label>
      </div>
    </div>
  );
}
