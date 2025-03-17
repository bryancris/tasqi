
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface NotificationToggleProps {
  reminderEnabled: boolean;
  isLoading: boolean;
  fcmStatus: 'loading' | 'ready' | 'error';
  onToggle: (checked: boolean) => void;
}

export function NotificationToggle({
  reminderEnabled,
  isLoading,
  fcmStatus,
  onToggle
}: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Switch
          id="reminder"
          checked={reminderEnabled}
          onCheckedChange={onToggle}
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
  );
}
