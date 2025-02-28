
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TaskPriority } from "./TaskBoard";
import { DateSelector } from "./schedule/DateSelector";
import { TimeSelector } from "./schedule/TimeSelector";
import { PrioritySelector } from "./schedule/PrioritySelector";

export interface TaskScheduleFieldsProps {
  isScheduled: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  onIsScheduledChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority) => void;
}

export function TaskScheduleFields({
  isScheduled,
  date,
  startTime,
  endTime,
  priority,
  onIsScheduledChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onPriorityChange,
}: TaskScheduleFieldsProps) {
  // Handle start time change and automatically update end time if it's not set
  const handleStartTimeChange = (value: string) => {
    onStartTimeChange(value);
    
    // If end time is not set or is the same as the old start time, calculate a new end time
    if (!endTime || endTime === startTime) {
      // Check if the time has the expected format
      if (value && value.includes(':')) {
        // Parse the hours and minutes from the new start time
        const [hours, minutes] = value.split(':').map(Number);
        
        // Add one hour
        const endHours = (hours + 1) % 24;
        
        // Format back to HH:MM:SS
        const newEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        
        onEndTimeChange(newEndTime);
        console.log(`Set end time to ${newEndTime} based on start time ${value}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="scheduled"
          checked={isScheduled}
          onCheckedChange={onIsScheduledChange}
        />
        <Label htmlFor="scheduled">Schedule this task</Label>
      </div>

      {isScheduled && (
        <div className="space-y-6 mt-4">
          <div className="w-full">
            <DateSelector 
              date={date} 
              onDateChange={onDateChange}
              className="w-full"
            />
          </div>
          <TimeSelector
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={onEndTimeChange}
          />
          <PrioritySelector 
            priority={priority} 
            onPriorityChange={onPriorityChange} 
          />
        </div>
      )}
    </div>
  );
}
