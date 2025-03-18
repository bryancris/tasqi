
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
  
  // Handle input changes and preserve user input
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Pass the raw input value first to preserve what the user typed
    const inputValue = e.target.value;
    
    // Then add seconds if needed for the data format
    const formattedTime = inputValue.includes(':') ? 
      (inputValue.includes(':') && inputValue.split(':').length === 2 ? `${inputValue}:00` : inputValue) : 
      inputValue;
    
    onStartTimeChange(formattedTime);
    
    // If end time is empty or is the same as the old start time, set end time to start time + 1 hour
    if (!endTime || endTime === startTime) {
      try {
        // Only calculate end time if we have a valid time string
        if (inputValue.includes(':')) {
          // Split the time into hours and minutes
          const [hours, minutes] = inputValue.split(':').map(Number);
          
          // Only proceed if we have valid numbers
          if (!isNaN(hours) && !isNaN(minutes)) {
            // Add one hour to the start time
            const endHours = (hours + 1) % 24;
            
            // Format the new end time with seconds
            const newEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
            
            // Update the end time
            onEndTimeChange(newEndTime);
          }
        }
      } catch (error) {
        console.error("Error calculating end time:", error);
      }
    }
  };
  
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedTime = inputValue.includes(':') && inputValue.split(':').length === 2 ? 
      `${inputValue}:00` : inputValue;
    onEndTimeChange(formattedTime);
  };
  
  // Format time string for display in the input field - strip seconds
  const formatTimeForInput = (time: string): string => {
    if (!time || time === "") return '';
    
    // If the time has a colon, extract hours and minutes
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
