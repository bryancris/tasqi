import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TimeSelectorProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function TimeSelector({ 
  startTime, 
  endTime, 
  onStartTimeChange, 
  onEndTimeChange 
}: TimeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="startTime">Start Time</Label>
        <Input
          type="time"
          id="startTime"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endTime">End Time</Label>
        <Input
          type="time"
          id="endTime"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}