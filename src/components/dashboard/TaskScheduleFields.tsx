
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
  // Handle toggle changes with improved transitions
  const handleIsScheduledChange = (value: boolean) => {
    console.log("Scheduled toggle changed to:", value);
    
    // If turning off scheduled, clear related fields
    if (!value && isScheduled) {
      console.log("Turning off scheduled mode, clearing related fields");
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
      console.log("Turning on scheduled while event is active, disabling event mode");
      onIsEventChange(false);
    }
  };

  const handleIsEventChange = (value: boolean) => {
    console.log("Event toggle changed to:", value);
    
    // If turning ON event mode, make sure we have a date
    if (value && !isEvent && !date) {
      // Set a default date to today when enabling event mode if no date is set
      const today = new Date().toISOString().split('T')[0];
      console.log("Setting default date for event:", today);
      onDateChange(today);
    }
    
    // If turning off event mode, clear event-specific settings
    if (!value && isEvent) {
      console.log("Turning off event mode, clearing event-specific settings");
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
      console.log("Turning on event while scheduled is active, disabling scheduled mode");
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
                onCheckedChange={(checked) => {
                  const newValue = !!checked;
                  console.log("All day changed to:", newValue);
                  onIsAllDayChange(newValue);
                  // Clear time fields when switching to all day
                  if (newValue) {
                    onStartTimeChange("");
                    onEndTimeChange("");
                  }
                }}
              />
              <Label htmlFor="all-day">All Day Event</Label>
            </div>
          )}

          {!isAllDay && (
            <TimeSelector
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={onStartTimeChange}
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
