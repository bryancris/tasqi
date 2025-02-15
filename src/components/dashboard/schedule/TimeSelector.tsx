
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [startHours, setStartHours] = useState("");
  const [startMinutes, setStartMinutes] = useState("");  // Changed initial state to empty string
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endHours, setEndHours] = useState("");
  const [endMinutes, setEndMinutes] = useState("");  // Changed initial state to empty string
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const hourNum = parseInt(hours);
      if (hourNum >= 12) {
        setStartPeriod("PM");
        setStartHours(hourNum === 12 ? "12" : String(hourNum - 12));
      } else {
        setStartPeriod("AM");
        setStartHours(hourNum === 0 ? "12" : String(hourNum));
      }
      // Don't pad minutes when setting state
      setStartMinutes(minutes ? String(parseInt(minutes)) : "");
    }
  }, [startTime]);

  useEffect(() => {
    if (endTime) {
      const [hours, minutes] = endTime.split(':');
      const hourNum = parseInt(hours);
      if (hourNum >= 12) {
        setEndPeriod("PM");
        setEndHours(hourNum === 12 ? "12" : String(hourNum - 12));
      } else {
        setEndPeriod("AM");
        setEndHours(hourNum === 0 ? "12" : String(hourNum));
      }
      // Don't pad minutes when setting state
      setEndMinutes(minutes ? String(parseInt(minutes)) : "");
    }
  }, [endTime]);

  const formatTime = (hours: string, minutes: string, period: "AM" | "PM") => {
    let hourNum = parseInt(hours || "12");
    
    // Convert 12-hour to 24-hour format
    if (period === "PM" && hourNum !== 12) {
      hourNum += 12;
    } else if (period === "AM" && hourNum === 12) {
      hourNum = 0;
    }
    
    // Format minutes for the final time string
    const paddedMinutes = (minutes || "0").padStart(2, '0');
    return `${String(hourNum).padStart(2, '0')}:${paddedMinutes}:00`;
  };

  const handleHourChange = (value: string, type: 'start' | 'end') => {
    // Remove any non-digits
    const cleanValue = value.replace(/\D/g, '');
    
    // Only update if the value is valid (empty or 1-12)
    const num = parseInt(cleanValue);
    if (!cleanValue || (num >= 0 && num <= 12)) {
      if (type === 'start') {
        setStartHours(cleanValue);
        onStartTimeChange(formatTime(cleanValue || "12", startMinutes, startPeriod));
      } else {
        setEndHours(cleanValue);
        onEndTimeChange(formatTime(cleanValue || "12", endMinutes, endPeriod));
      }
    }
  };

  const handleMinuteChange = (value: string, type: 'start' | 'end') => {
    // Remove any non-digits
    const cleanValue = value.replace(/\D/g, '');
    
    // Only update if the value is valid (0-59)
    const num = parseInt(cleanValue || "0");
    if (!cleanValue || (num >= 0 && num <= 59)) {
      if (type === 'start') {
        setStartMinutes(cleanValue);
        onStartTimeChange(formatTime(startHours || "12", cleanValue, startPeriod));
      } else {
        setEndMinutes(cleanValue);
        onEndTimeChange(formatTime(endHours || "12", cleanValue, endPeriod));
      }
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label htmlFor="startTime" className="text-sm">Start Time</Label>
        <div className="flex items-center gap-1 mt-1">
          <Input
            type="text"
            inputMode="numeric"
            value={startHours}
            onChange={(e) => handleHourChange(e.target.value, 'start')}
            className="w-12 text-center px-1"
            maxLength={2}
          />
          <span>:</span>
          <Input
            type="text"
            inputMode="numeric"
            value={startMinutes}
            onChange={(e) => handleMinuteChange(e.target.value, 'start')}
            className="w-12 text-center px-1"
            maxLength={2}
          />
          <Button
            variant="ghost"
            onClick={() => {
              const newPeriod = startPeriod === "AM" ? "PM" : "AM";
              setStartPeriod(newPeriod);
              onStartTimeChange(formatTime(startHours || "12", startMinutes, newPeriod));
            }}
            className="px-2 h-8"
            type="button"
          >
            {startPeriod}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="endTime" className="text-sm">End Time</Label>
        <div className="flex items-center gap-1 mt-1">
          <Input
            type="text"
            inputMode="numeric"
            value={endHours}
            onChange={(e) => handleHourChange(e.target.value, 'end')}
            className="w-12 text-center px-1"
            maxLength={2}
          />
          <span>:</span>
          <Input
            type="text"
            inputMode="numeric"
            value={endMinutes}
            onChange={(e) => handleMinuteChange(e.target.value, 'end')}
            className="w-12 text-center px-1"
            maxLength={2}
          />
          <Button
            variant="ghost"
            onClick={() => {
              const newPeriod = endPeriod === "AM" ? "PM" : "AM";
              setEndPeriod(newPeriod);
              onEndTimeChange(formatTime(endHours || "12", endMinutes, newPeriod));
            }}
            className="px-2 h-8"
            type="button"
          >
            {endPeriod}
          </Button>
        </div>
      </div>
    </div>
  );
}
