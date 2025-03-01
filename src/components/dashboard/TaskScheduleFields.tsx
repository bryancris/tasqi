
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TaskPriority } from "./TaskBoard";
import { DateSelector } from "./schedule/DateSelector";
import { TimeSelector } from "./schedule/TimeSelector";
import { PrioritySelector } from "./schedule/PrioritySelector";
import { Checkbox } from "@/components/ui/checkbox";

export interface TaskScheduleFieldsProps {
  isScheduled: boolean;
  isEvent: boolean;
  isAllDay: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  onIsScheduledChange: (value: boolean) => void;
  onIsEventChange: (value: boolean) => void;
  onIsAllDayChange: (value: boolean) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority) => void;
}

export function TaskScheduleFields({
  isScheduled,
  isEvent,
  isAllDay,
  date,
  startTime,
  endTime,
  priority,
  onIsScheduledChange,
  onIsEventChange,
  onIsAllDayChange,
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

  // Handle toggle changes with improved transitions
  const handleIsScheduledChange = (value: boolean) => {
    // If turning off scheduled, clear related fields
    if (!value && isScheduled) {
      // Only clear date and times if not in event mode
      if (!isEvent) {
        onDateChange("");
        onStartTimeChange("");
        onEndTimeChange("");
      }
    }
    
    onIsScheduledChange(value);
    
    // If turning on scheduled, turn off event (they're mutually exclusive)
    if (value && isEvent) {
      onIsEventChange(false);
    }
  };

  const handleIsEventChange = (value: boolean) => {
    // If turning off event mode, clear event-specific settings
    if (!value && isEvent) {
      // Clear all-day setting
      onIsAllDayChange(false);
      
      // If not switching to scheduled mode, clear date and times
      if (!isScheduled) {
        onDateChange("");
        onStartTimeChange("");
        onEndTimeChange("");
      }
    }
    
    onIsEventChange(value);
    
    // If turning on event, turn off scheduled (they're mutually exclusive)
    if (value && isScheduled) {
      onIsScheduledChange(false);
    }
  };

  // Determine if we need to show date/time fields (for both scheduled tasks and events)
  const showDateTimeFields = isScheduled || isEvent;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="scheduled"
            checked={isScheduled}
            onCheckedChange={handleIsScheduledChange}
          />
          <Label htmlFor="scheduled">Schedule Task</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="event"
            checked={isEvent}
            onCheckedChange={handleIsEventChange}
          />
          <Label htmlFor="event">Event</Label>
        </div>
      </div>

      {showDateTimeFields && (
        <div className="space-y-6 mt-4">
          <div className="w-full">
            <DateSelector 
              date={date} 
              onDateChange={onDateChange}
              className="w-full"
            />
          </div>
          
          {isEvent && (
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox 
                id="all-day"
                checked={isAllDay}
                onCheckedChange={(checked) => onIsAllDayChange(checked as boolean)}
              />
              <Label htmlFor="all-day">All Day Event</Label>
            </div>
          )}

          {!isAllDay && (
            <TimeSelector
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={handleStartTimeChange}
              onEndTimeChange={onEndTimeChange}
            />
          )}
          
          {/* Only show priority selector for tasks, not for events */}
          {!isEvent && (
            <PrioritySelector 
              priority={priority} 
              onPriorityChange={onPriorityChange} 
            />
          )}
        </div>
      )}
    </div>
  );
}
