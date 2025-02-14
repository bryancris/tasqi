
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [startHours, setStartHours] = useState("8");
  const [startMinutes, setStartMinutes] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endHours, setEndHours] = useState("9");
  const [endMinutes, setEndMinutes] = useState("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  // Initialize time fields when props change
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      let parsedHours = parseInt(hours);
      if (parsedHours >= 12) {
        setStartPeriod("PM");
        if (parsedHours > 12) parsedHours -= 12;
      } else {
        setStartPeriod("AM");
        if (parsedHours === 0) parsedHours = 12;
      }
      setStartHours(parsedHours.toString());
      setStartMinutes(minutes);
    }
  }, [startTime]);

  useEffect(() => {
    if (endTime) {
      const [hours, minutes] = endTime.split(':');
      let parsedHours = parseInt(hours);
      if (parsedHours >= 12) {
        setEndPeriod("PM");
        if (parsedHours > 12) parsedHours -= 12;
      } else {
        setEndPeriod("AM");
        if (parsedHours === 0) parsedHours = 12;
      }
      setEndHours(parsedHours.toString());
      setEndMinutes(minutes);
    }
  }, [endTime]);

  const handleStartTimeChange = () => {
    let hours = parseInt(startHours);
    if (startPeriod === "PM" && hours !== 12) hours += 12;
    if (startPeriod === "AM" && hours === 12) hours = 0;
    const time = `${hours.toString().padStart(2, '0')}:${startMinutes.padStart(2, '0')}:00`;
    onStartTimeChange(time);
  };

  const handleEndTimeChange = () => {
    let hours = parseInt(endHours);
    if (endPeriod === "PM" && hours !== 12) hours += 12;
    if (endPeriod === "AM" && hours === 12) hours = 0;
    const time = `${hours.toString().padStart(2, '0')}:${endMinutes.padStart(2, '0')}:00`;
    onEndTimeChange(time);
  };

  const handleStartHourChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setStartHours(num.toString());
      setTimeout(handleStartTimeChange, 0);
    }
  };

  const handleStartMinuteChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      setStartMinutes(num.toString().padStart(2, '0'));
      setTimeout(handleStartTimeChange, 0);
    }
  };

  const handleEndHourChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setEndHours(num.toString());
      setTimeout(handleEndTimeChange, 0);
    }
  };

  const handleEndMinuteChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      setEndMinutes(num.toString().padStart(2, '0'));
      setTimeout(handleEndTimeChange, 0);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="startTime">Start Time</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            max="12"
            value={startHours}
            onChange={(e) => handleStartHourChange(e.target.value)}
            className="w-16 text-center"
          />
          <span>:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={startMinutes}
            onChange={(e) => handleStartMinuteChange(e.target.value)}
            className="w-16 text-center"
          />
          <Button
            variant="ghost"
            onClick={() => {
              setStartPeriod(startPeriod === "AM" ? "PM" : "AM");
              setTimeout(handleStartTimeChange, 0);
            }}
            className="px-3"
          >
            {startPeriod}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime">End Time</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            max="12"
            value={endHours}
            onChange={(e) => handleEndHourChange(e.target.value)}
            className="w-16 text-center"
          />
          <span>:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={endMinutes}
            onChange={(e) => handleEndMinuteChange(e.target.value)}
            className="w-16 text-center"
          />
          <Button
            variant="ghost"
            onClick={() => {
              setEndPeriod(endPeriod === "AM" ? "PM" : "AM");
              setTimeout(handleEndTimeChange, 0);
            }}
            className="px-3"
          >
            {endPeriod}
          </Button>
        </div>
      </div>
    </div>
  );
}
