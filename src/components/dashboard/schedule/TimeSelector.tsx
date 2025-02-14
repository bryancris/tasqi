
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
  const [startHours, setStartHours] = useState("00");
  const [startMinutes, setStartMinutes] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [endHours, setEndHours] = useState("00");
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
      setStartHours(parsedHours.toString().padStart(2, '0'));
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
      setEndHours(parsedHours.toString().padStart(2, '0'));
      setEndMinutes(minutes);
    }
  }, [endTime]);

  const formatTime = (hours: number, minutes: string, period: "AM" | "PM") => {
    let formattedHours = hours;
    if (period === "PM" && hours !== 12) formattedHours += 12;
    if (period === "AM" && hours === 12) formattedHours = 0;
    return `${formattedHours.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const handleTimeChange = (type: 'start' | 'end') => {
    try {
      if (type === 'start') {
        const hours = parseInt(startHours) || 0;
        const time = formatTime(hours, startMinutes, startPeriod);
        onStartTimeChange(time);
      } else {
        const hours = parseInt(endHours) || 0;
        const time = formatTime(hours, endMinutes, endPeriod);
        onEndTimeChange(time);
      }
    } catch (error) {
      console.error(`Error formatting ${type} time:`, error);
    }
  };

  const handleHourChange = (value: string, type: 'start' | 'end') => {
    // Only allow numbers and restrict to 2 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 2);
    const numValue = parseInt(cleanValue);

    if (cleanValue === '' || (numValue >= 0 && numValue <= 12)) {
      if (type === 'start') {
        setStartHours(cleanValue);
        handleTimeChange('start');
      } else {
        setEndHours(cleanValue);
        handleTimeChange('end');
      }
    }
  };

  const handleMinuteChange = (value: string, type: 'start' | 'end') => {
    // Only allow numbers and restrict to 2 digits
    const cleanValue = value.replace(/\D/g, '').slice(0, 2);
    const numValue = parseInt(cleanValue);

    if (cleanValue === '' || (numValue >= 0 && numValue <= 59)) {
      if (type === 'start') {
        setStartMinutes(cleanValue);
        handleTimeChange('start');
      } else {
        setEndMinutes(cleanValue);
        handleTimeChange('end');
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
              setStartPeriod(startPeriod === "AM" ? "PM" : "AM");
              handleTimeChange('start');
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
              setEndPeriod(endPeriod === "AM" ? "PM" : "AM");
              handleTimeChange('end');
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
