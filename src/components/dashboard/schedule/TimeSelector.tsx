
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

  useEffect(() => {
    if (startTime) {
      const [hours] = startTime.split(':');
      const hourNum = parseInt(hours);
      if (hourNum >= 12) {
        setStartPeriod("PM");
        setStartHours(hourNum === 12 ? "12" : (hourNum - 12).toString());
      } else {
        setStartPeriod("AM");
        setStartHours(hourNum === 0 ? "12" : hours);
      }
      setStartMinutes(startTime.split(':')[1]);
    }
  }, [startTime]);

  useEffect(() => {
    if (endTime) {
      const [hours] = endTime.split(':');
      const hourNum = parseInt(hours);
      if (hourNum >= 12) {
        setEndPeriod("PM");
        setEndHours(hourNum === 12 ? "12" : (hourNum - 12).toString());
      } else {
        setEndPeriod("AM");
        setEndHours(hourNum === 0 ? "12" : hours);
      }
      setEndMinutes(endTime.split(':')[1]);
    }
  }, [endTime]);

  const formatTime = (hours: string, minutes: string, period: "AM" | "PM") => {
    let hourNum = parseInt(hours);
    if (period === "PM" && hourNum !== 12) hourNum += 12;
    if (period === "AM" && hourNum === 12) hourNum = 0;
    return `${hourNum.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const handleTimeChange = (type: 'start' | 'end') => {
    if (type === 'start') {
      const time = formatTime(startHours, startMinutes, startPeriod);
      onStartTimeChange(time);
    } else {
      const time = formatTime(endHours, endMinutes, endPeriod);
      onEndTimeChange(time);
    }
  };

  const handleHourChange = (value: string, type: 'start' | 'end') => {
    // Only allow numbers
    const cleanValue = value.replace(/\D/g, '');
    
    // Don't process if empty or greater than 12
    if (cleanValue === '' || parseInt(cleanValue) <= 12) {
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
    // Only allow numbers
    const cleanValue = value.replace(/\D/g, '');
    
    // Don't process if empty or greater than 59
    if (cleanValue === '' || parseInt(cleanValue) <= 59) {
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
