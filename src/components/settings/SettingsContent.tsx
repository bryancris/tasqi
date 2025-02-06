
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function SettingsContent() {
  const [startHour, setStartHour] = useState<string>("8");
  const [endHour, setEndHour] = useState<string>("17");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('start_hour, end_hour')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load time settings"
        });
        return;
      }

      if (data) {
        setStartHour(data.start_hour.toString());
        setEndHour(data.end_hour.toString());
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
        <h3 className="text-lg font-medium">Time Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize your working hours for the calendar views
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
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
