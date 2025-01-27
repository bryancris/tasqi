import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskScheduleFieldsProps {
  date: string;
  startTime: string;
  endTime: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function TaskScheduleFields({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: TaskScheduleFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="date-input">Date</Label>
        <Input 
          id="date-input" 
          type="date" 
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="cursor-pointer"
          min={new Date().toISOString().split('T')[0]} // Prevent past dates
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time</Label>
          <Input 
            id="start-time" 
            type="time" 
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="cursor-pointer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-time">End Time</Label>
          <Input 
            id="end-time" 
            type="time" 
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className="cursor-pointer"
          />
        </div>
      </div>
    </>
  );
}