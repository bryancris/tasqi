
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

  const formatTime = (hours: number, minutes: string, period: "AM" | "PM") => {
    let formattedHours = hours;
    if (period === "PM" && hours !== 12) formattedHours += 12;
    if (period === "AM" && hours === 12) formattedHours = 0;
    return `${formattedHours.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const handleTimeChange = (type: 'start' | 'end') => {
    try {
      if (type === 'start') {
        const time = formatTime(parseInt(startHours), startMinutes, startPeriod);
        onStartTimeChange(time);
      } else {
        const time = formatTime(parseInt(endHours), endMinutes, endPeriod);
        onEndTimeChange(time);
      }
    } catch (error) {
      console.error(`Error formatting ${type} time:`, error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label htmlFor="startTime" className="text-sm">Start Time</Label>
        <div className="flex items-center gap-1 mt-1">
          <Input
            type="number"
            min="1"
            max="12"
            value={startHours}
            onChange={(e) => {
              const num = parseInt(e.target.value);
              if (!isNaN(num) && num >= 1 && num <= 12) {
                setStartHours(num.toString());
                handleTimeChange('start');
              }
            }}
            className="w-12 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span>:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={startMinutes}
            onChange={(e) => {
              const num = parseInt(e.target.value);
              if (!isNaN(num) && num >= 0 && num <= 59) {
                setStartMinutes(num.toString().padStart(2, '0'));
                handleTimeChange('start');
              }
            }}
            className="w-12 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            type="number"
            min="1"
            max="12"
            value={endHours}
            onChange={(e) => {
              const num = parseInt(e.target.value);
              if (!isNaN(num) && num >= 1 && num <= 12) {
                setEndHours(num.toString());
                handleTimeChange('end');
              }
            }}
            className="w-12 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span>:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={endMinutes}
            onChange={(e) => {
              const num = parseInt(e.target.value);
              if (!isNaN(num) && num >= 0 && num <= 59) {
                setEndMinutes(num.toString().padStart(2, '0'));
                handleTimeChange('end');
              }
            }}
            className="w-12 text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
