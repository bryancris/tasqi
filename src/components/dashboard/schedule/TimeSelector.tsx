
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useState } from "react";
import { TimePickerDialog } from "../form/TimePickerDialog";

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
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);

  const formatDisplayTime = (time: string) => {
    if (!time) return "Select time";
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="startTime">Start Time</Label>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          onClick={() => setOpenStartTime(true)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime(startTime)}
        </Button>
        <TimePickerDialog
          open={openStartTime}
          onOpenChange={setOpenStartTime}
          onTimeSelect={onStartTimeChange}
          initialTime={startTime}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endTime">End Time</Label>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          onClick={() => setOpenEndTime(true)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime(endTime)}
        </Button>
        <TimePickerDialog
          open={openEndTime}
          onOpenChange={setOpenEndTime}
          onTimeSelect={onEndTimeChange}
          initialTime={endTime}
        />
      </div>
    </div>
  );
}
