import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef } from "react";

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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.click();
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="date-input">Date</Label>
        <div className="relative">
          <Input 
            id="date-input" 
            type="date" 
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="cursor-pointer"
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
            ref={dateInputRef}
          />
          <div 
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => handleIconClick(dateInputRef)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time</Label>
          <div className="relative">
            <Input 
              id="start-time" 
              type="time" 
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="cursor-pointer"
              ref={startTimeInputRef}
            />
            <div 
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => handleIconClick(startTimeInputRef)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-time">End Time</Label>
          <div className="relative">
            <Input 
              id="end-time" 
              type="time" 
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="cursor-pointer"
              ref={endTimeInputRef}
            />
            <div 
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => handleIconClick(startTimeInputRef)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}