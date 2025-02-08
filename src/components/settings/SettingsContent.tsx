import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsContent() {
  const [startHour, setStartHour] = useState<string>("8");
  const [endHour, setEndHour] = useState<string>("17");
  const [sharedCalendarEnabled, setSharedCalendarEnabled] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState<"view" | "edit" | "admin">("view");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('start_hour, end_hour, shared_calendar_enabled')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings"
        });
        return;
      }

      if (data) {
        setStartHour(data.start_hour.toString());
        setEndHour(data.end_hour.toString());
        setSharedCalendarEnabled(data.shared_calendar_enabled || false);
      }
    };

    loadUserSettings();
  }, [toast]);

  const handleTimeChange = async (value: string, type: 'start' | 'end') => {
    const newValue = parseInt(value);
    const currentStart = parseInt(startHour);
    const currentEnd = parseInt(endHour);

    // Validate time range
    if (type === 'start' && newValue >= currentEnd) {
      toast({
        variant: "destructive",
        title: "Invalid Time Range",
        description: "Start time must be before end time"
      });
      return;
    }

    if (type === 'end' && newValue <= currentStart) {
      toast({
        variant: "destructive",
        title: "Invalid Time Range",
        description: "End time must be after start time"
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const updates = type === 'start' 
        ? { start_hour: newValue }
        : { end_hour: newValue };

      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: session.user.id,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      if (type === 'start') {
        setStartHour(value);
      } else {
        setEndHour(value);
      }

      // Invalidate queries that depend on time settings
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Success",
        description: "Time settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating time settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update time settings"
      });
    }
  };

  const handleSharedCalendarToggle = async (enabled: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: session.user.id,
          shared_calendar_enabled: enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSharedCalendarEnabled(enabled);
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

      toast({
        title: "Success",
        description: `Shared calendar ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating shared calendar settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update shared calendar settings"
      });
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      const { error } = await supabase
        .from('calendar_invitations')
        .insert({
          recipient_email: inviteEmail,
          permission_level: permissionLevel,
        });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`
      });
      
      setInviteEmail("");
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const displayHour = hour === 0 ? "12 AM" : 
                       hour < 12 ? `${hour} AM` : 
                       hour === 12 ? "12 PM" : 
                       `${hour - 12} PM`;
    return { value: hour.toString(), label: displayHour };
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how the app looks and feels
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Theme</Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark mode
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

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
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Invite User</Label>
                <div className="flex gap-4">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <Select
                    value={permissionLevel}
                    onValueChange={(value: "view" | "edit" | "admin") => setPermissionLevel(value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? "Sending..." : "Invite"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Select 
              value={startHour} 
              onValueChange={(value) => handleTimeChange(value, 'start')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Select 
              value={endHour} 
              onValueChange={(value) => handleTimeChange(value, 'end')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
