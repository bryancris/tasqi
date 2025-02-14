
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
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

  const handleTimeSet = () => {
    let formattedHours = hours;
    if (period === "PM" && hours !== 12) formattedHours += 12;
    if (period === "AM" && hours === 12) formattedHours = 0;
    
    const time = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    onTimeSelect(time);
    onOpenChange(false);
  };

  const handleMinuteChange = (angle: number) => {
    const newMinutes = Math.round(angle / 6); // 360 degrees / 60 minutes = 6 degrees per minute
    setMinutes(newMinutes);
  };

  const handleHourChange = (angle: number) => {
    const newHours = Math.round(angle / 30); // 360 degrees / 12 hours = 30 degrees per hour
    setHours(newHours === 0 ? 12 : newHours);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <div className="bg-[#4A5AB9] text-white p-6 text-center text-4xl font-light">
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
          <div className="relative w-[280px] h-[280px] mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-gray-100">
              <div className="absolute w-1 h-1 bg-gray-400 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              {/* Clock numbers */}
              {[...Array(12)].map((_, i) => {
                const angle = ((i + 1) * 30 * Math.PI) / 180;
                const x = 140 + Math.sin(angle) * 120;
                const y = 140 - Math.cos(angle) * 120;
                return (
                  <div
                    key={i}
                    className={`absolute text-gray-600 font-medium ${
                      hours === i + 1 ? "text-blue-600" : ""
                    }`}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {i + 1}
                  </div>
                );
              })}
              {/* Clock hand */}
              <div
                className="absolute w-[2px] bg-blue-600 origin-bottom left-1/2 -translate-x-1/2"
                style={{
                  height: "100px",
                  bottom: "50%",
                  transform: `translateX(-50%) rotate(${hours * 30}deg)`,
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
