
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { UserInviteForm } from "./UserInviteForm";

interface CalendarSettingsProps {
  initialStartHour: string;
  initialEndHour: string;
  initialSharedCalendarEnabled: boolean;
}

export function CalendarSettings({ 
  initialStartHour, 
  initialEndHour, 
  initialSharedCalendarEnabled 
}: CalendarSettingsProps) {
  const [startHour, setStartHour] = useState(initialStartHour);
  const [endHour, setEndHour] = useState(initialEndHour);
  const [sharedCalendarEnabled, setSharedCalendarEnabled] = useState(initialSharedCalendarEnabled);
  const queryClient = useQueryClient();

  const handleSharedCalendarToggle = async (enabled: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in to change calendar settings");
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: session.user.id,
          shared_calendar_enabled: enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSharedCalendarEnabled(enabled);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Shared calendar ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating shared calendar settings:', error);
      toast.error("Failed to update shared calendar settings");
      // Revert the UI state if the update failed
      setSharedCalendarEnabled(!enabled);
    }
  };

  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Calendar Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize your calendar preferences
        </p>
      </div>
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Shared Calendar</Label>
            <p className="text-sm text-muted-foreground">
              Enable calendar sharing with other users
            </p>
          </div>
          <Switch
            checked={sharedCalendarEnabled}
            onCheckedChange={handleSharedCalendarToggle}
          />
        </div>

        {sharedCalendarEnabled && (
          <div className="space-y-4 pt-4">
            <UserInviteForm />
          </div>
        )}

        <TimeRangeSelector
          startHour={startHour}
          endHour={endHour}
          onStartHourChange={setStartHour}
          onEndHourChange={setEndHour}
        />
      </div>
    </div>
  );
}
