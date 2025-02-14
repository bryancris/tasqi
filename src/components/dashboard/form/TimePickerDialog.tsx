
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TimePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTimeSelect: (time: string) => void;
  initialTime?: string;
}

export function TimePickerDialog({ 
  open, 
  onOpenChange, 
  onTimeSelect,
  initialTime 
}: TimePickerDialogProps) {
  const [hours, setHours] = useState(8);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [isMinuteMode, setIsMinuteMode] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTime) {
      const [hoursStr, minutesStr] = initialTime.split(":");
      let parsedHours = parseInt(hoursStr);
      const parsedMinutes = parseInt(minutesStr);
      
      if (parsedHours >= 12) {
        setPeriod("PM");
        if (parsedHours > 12) parsedHours -= 12;
      } else {
        setPeriod("AM");
        if (parsedHours === 0) parsedHours = 12;
      }
      
      setHours(parsedHours);
      setMinutes(parsedMinutes);
    }
  }, [initialTime, open]);

  const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    let angle = Math.atan2(x, -y) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    if (isMinuteMode) {
      const newMinutes = Math.round(angle / 6) % 60; // 360 / 60 = 6 degrees per minute
      setMinutes(newMinutes);
    } else {
      let newHours = Math.round(angle / 30) % 12; // 360 / 12 = 30 degrees per hour
      if (newHours === 0) newHours = 12;
      setHours(newHours);
    }
  };

  const handleTimeSet = () => {
    let formattedHours = hours;
    if (period === "PM" && hours !== 12) formattedHours += 12;
    if (period === "AM" && hours === 12) formattedHours = 0;
    
    const time = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    onTimeSelect(time);
    onOpenChange(false);
  };

  const getHandRotation = () => {
    if (isMinuteMode) {
      return minutes * 6; // 360 / 60 = 6 degrees per minute
    }
    return hours * 30; // 360 / 12 = 30 degrees per hour
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <div className="bg-[#4A5AB9] text-white p-6 text-center text-4xl font-light cursor-pointer"
             onClick={() => setIsMinuteMode(!isMinuteMode)}>
          {format(
            new Date(2024, 0, 1, 
              period === "PM" && hours !== 12 ? hours + 12 : 
              period === "AM" && hours === 12 ? 0 : hours, 
              minutes
            ),
            "h:mm"
          )}
          <div className="text-2xl mt-1">{period}</div>
        </div>
        
        <div className="p-6">
          <div 
            ref={clockRef}
            className="relative w-[280px] h-[280px] mx-auto mb-4 cursor-pointer"
            onClick={handleClockClick}
          >
            <div className="absolute inset-0 rounded-full bg-gray-100">
              <div className="absolute w-1 h-1 bg-gray-400 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              
              {/* Clock numbers */}
              {[...Array(isMinuteMode ? 12 : 12)].map((_, i) => {
                const value = isMinuteMode ? i * 5 : i + 1;
                const angle = (value * (isMinuteMode ? 30 : 30) * Math.PI) / 180;
                const x = 140 + Math.sin(angle) * 120;
                const y = 140 - Math.cos(angle) * 120;
                
                return (
                  <div
                    key={i}
                    className={`absolute text-gray-600 font-medium ${
                      (isMinuteMode ? minutes === value : hours === value)
                        ? "text-blue-600"
                        : ""
                    }`}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {value}
                  </div>
                );
              })}

              {/* Clock hand */}
              <div
                className="absolute w-[2px] bg-blue-600 origin-bottom left-1/2 -translate-x-1/2"
                style={{
                  height: "100px",
                  bottom: "50%",
                  transform: `translateX(-50%) rotate(${getHandRotation()}deg)`,
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="space-x-2">
              <Button
                variant="ghost"
                onClick={() => setPeriod(period === "AM" ? "PM" : "AM")}
              >
                {period}
              </Button>
              <Button onClick={handleTimeSet}>Set</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
