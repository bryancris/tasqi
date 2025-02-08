
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TimeRangeSelectorProps {
  startHour: string;
  endHour: string;
  onStartHourChange: (value: string) => void;
  onEndHourChange: (value: string) => void;
}

export function TimeRangeSelector({ startHour, endHour, onStartHourChange, onEndHourChange }: TimeRangeSelectorProps) {
  const queryClient = useQueryClient();

  const handleTimeChange = async (value: string, type: 'start' | 'end') => {
    const newValue = parseInt(value);
    const currentStart = parseInt(startHour);
    const currentEnd = parseInt(endHour);

    if (type === 'start' && newValue >= currentEnd) {
      toast.error("Start time must be before end time");
      return;
    }

    if (type === 'end' && newValue <= currentStart) {
      toast.error("End time must be after start time");
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
        onStartHourChange(value);
      } else {
        onEndHourChange(value);
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Time settings updated successfully");
    } catch (error) {
      console.error('Error updating time settings:', error);
      toast.error("Failed to update time settings");
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
  );
}
