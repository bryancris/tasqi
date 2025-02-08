
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TimeRangeSelector } from "./TimeRangeSelector";

interface CalendarSettingsProps {
  initialStartHour: string;
  initialEndHour: string;
}

export function CalendarSettings({ 
  initialStartHour, 
  initialEndHour
}: CalendarSettingsProps) {
  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Calendar Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize your calendar preferences
        </p>
      </div>
      <Separator />
      
      <div className="space-y-4">
        <TimeRangeSelector
          startHour={initialStartHour}
          endHour={initialEndHour}
          onStartHourChange={() => {}}
          onEndHourChange={() => {}}
        />
      </div>
    </div>
  );
}
