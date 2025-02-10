
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { useState, useEffect } from "react";

interface CalendarSettingsProps {
  initialStartHour: string;
  initialEndHour: string;
  onTimeChange: (startHour: string, endHour: string) => void;
}

export function CalendarSettings({ 
  initialStartHour, 
  initialEndHour,
  onTimeChange
}: CalendarSettingsProps) {
  const [startHour, setStartHour] = useState(initialStartHour);
  const [endHour, setEndHour] = useState(initialEndHour);

  useEffect(() => {
    setStartHour(initialStartHour);
    setEndHour(initialEndHour);
  }, [initialStartHour, initialEndHour]);

  const handleStartHourChange = (value: string) => {
    setStartHour(value);
    onTimeChange(value, endHour);
  };

  const handleEndHourChange = (value: string) => {
    setEndHour(value);
    onTimeChange(startHour, value);
  };

  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Calendar Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize your calendar preferences
        </p>
      </div>
      <Separator className="my-6" />
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-4">Time Settings</h4>
          <TimeRangeSelector
            startHour={startHour}
            endHour={endHour}
            onStartHourChange={handleStartHourChange}
            onEndHourChange={handleEndHourChange}
          />
        </div>

        <Separator />
        
        <div>
          <h4 className="text-sm font-medium mb-4">Shared Task Settings</h4>
          <p className="text-sm text-muted-foreground">
            Configure how shared tasks appear and behave in your calendar
          </p>
          {/* Placeholder for future shared task settings */}
        </div>
      </div>
    </div>
  );
}
