
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
  
  // Handle input changes and format with seconds
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Add seconds to the time value
    onStartTimeChange(`${e.target.value}:00`);
    
    // If end time is empty or is the same as the old start time, set end time to start time + 1 hour
    if (!endTime || endTime === startTime) {
      // Split the time into hours and minutes
      const [hours, minutes] = e.target.value.split(':').map(Number);
      
      // Add one hour to the start time
      const endHours = (hours + 1) % 24;
      
      // Format the new end time with seconds
      const newEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      // Update the end time
      onEndTimeChange(newEndTime);
    }
  };
  
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEndTimeChange(`${e.target.value}:00`);
  };
  
  // Remove seconds from time string for display in the input field
  const formatTimeForInput = (time: string): string => {
    if (!time) return '';
    // If the time already has a colon, extract hours and minutes
    if (time.includes(':')) {
      return time.split(':').slice(0, 2).join(':');
    }
    return time; // Return as is if it doesn't match expected format
  };
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label htmlFor="startTime" className="text-sm">Start Time</Label>
        <div className="mt-1">
          <Input
            type="time"
            id="startTime"
            value={formatTimeForInput(startTime)}
            onChange={handleStartTimeChange}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="endTime" className="text-sm">End Time</Label>
        <div className="mt-1">
          <Input
            type="time"
            id="endTime"
            value={formatTimeForInput(endTime)}
            onChange={handleEndTimeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
