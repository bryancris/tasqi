
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
        <div className="space-y-4">
          <DateSelector date={date} onDateChange={onDateChange} />
          <TimeSelector
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={onStartTimeChange}
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
