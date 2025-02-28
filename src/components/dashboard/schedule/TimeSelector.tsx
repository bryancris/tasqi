
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
    onStartTimeChange(`${e.target.value}:00`);
  };
  
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEndTimeChange(`${e.target.value}:00`);
  };
  
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label htmlFor="startTime" className="text-sm">Start Time</Label>
        <div className="mt-1">
          <Input
            type="time"
            id="startTime"
            value={startTime.split(':').slice(0, 2).join(':')}
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
            value={endTime.split(':').slice(0, 2).join(':')}
            onChange={handleEndTimeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
