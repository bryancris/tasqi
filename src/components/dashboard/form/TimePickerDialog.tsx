
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
    
    let angle = Math.atan2(-x, -y) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    if (isMinuteMode) {
      const newMinutes = Math.round(angle / 6) % 60;
      setMinutes(newMinutes);
    } else {
      let newHours = Math.round(angle / 30) % 12;
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
      return minutes * 6 + 180; // 360 / 60 = 6 degrees per minute
    }
    return hours * 30 + 180; // 360 / 12 = 30 degrees per hour
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogTitle className="sr-only">Pick a time</DialogTitle>
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
              {/* Center dot */}
              <div className="absolute w-2 h-2 bg-[#4A5AB9] rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              
              {/* Clock numbers */}
              {[...Array(12)].map((_, i) => {
                const value = i + 1;
                const angle = ((value % 12) * 30 * Math.PI) / 180;
                const radius = 120;
                const x = 140 + Math.sin(angle) * radius;
                const y = 140 - Math.cos(angle) * radius;
                const isSelected = !isMinuteMode && hours === value;
                
                return (
                  <div key={i} className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
                    {isSelected && (
                      <div className="absolute w-10 h-10 bg-[#4A5AB9] rounded-full -translate-x-1/2 -translate-y-1/2" />
                    )}
                    <div
                      className={`relative z-10 flex items-center justify-center w-10 h-10 -translate-x-1/2 -translate-y-1/2 ${
                        isSelected ? "text-white" : "text-gray-600"
                      } font-medium text-lg`}
                    >
                      {value}
                    </div>
                  </div>
                );
              })}

              {/* Clock hand */}
              <div className="absolute w-[95px] h-[2px] bg-[#4A5AB9] left-1/2 top-1/2 -translate-y-1/2"
                   style={{
                     transformOrigin: 'left center',
                     transform: `rotate(${getHandRotation()}deg)`
                   }}>
                <div className="absolute right-0 -translate-y-1/2 w-2 h-2 bg-[#4A5AB9] rounded-full" />
              </div>
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
              <Button 
                onClick={handleTimeSet}
                className="bg-[#4A5AB9] text-white hover:bg-[#4A5AB9]/90"
              >
                Set
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
