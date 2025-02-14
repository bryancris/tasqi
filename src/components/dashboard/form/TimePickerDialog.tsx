
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 12) {
      setHours(value);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 59) {
      setMinutes(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-4">
        <DialogTitle className="sr-only">Pick a time</DialogTitle>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              min="1"
              max="12"
              value={hours}
              onChange={handleHourChange}
              className="w-16 text-center text-2xl"
            />
            <span className="text-2xl">:</span>
            <Input
              type="number"
              min="0"
              max="59"
              value={minutes.toString().padStart(2, '0')}
              onChange={handleMinuteChange}
              className="w-16 text-center text-2xl"
            />
            <Button
              variant="ghost"
              onClick={() => setPeriod(period === "AM" ? "PM" : "AM")}
              className="text-2xl"
            >
              {period}
            </Button>
          </div>

          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTimeSet}
              className="bg-[#4A5AB9] text-white hover:bg-[#4A5AB9]/90"
            >
              Set
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
