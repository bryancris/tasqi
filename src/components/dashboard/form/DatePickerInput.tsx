
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse, startOfToday } from "date-fns";
import { useState } from "react";
import { MonthColumn } from "./date-picker/MonthColumn";
import { DayColumn } from "./date-picker/DayColumn";
import { YearColumn } from "./date-picker/YearColumn";
import { DatePickerControls } from "./date-picker/DatePickerControls";

interface DatePickerInputProps {
  date: string;
  onDateChange: (value: string) => void;
  label?: string;
}

export function DatePickerInput({ date, onDateChange, label = "Date" }: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const today = startOfToday();
  
  // Initialize with today's date if no date is provided
  const [tempDate, setTempDate] = useState<Date>(
    date ? parse(date, 'yyyy-MM-dd', today) : today
  );
  
  const selectedDate = date ? parse(date, 'yyyy-MM-dd', today) : undefined;
  const currentDate = today;

  const handleSetDate = () => {
    if (tempDate) {
      onDateChange(format(tempDate, 'yyyy-MM-dd'));
    }
    setOpen(false);
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(month);
    setTempDate(new Date(newDate));
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(tempDate);
    newDate.setDate(day);
    setTempDate(new Date(newDate));
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(year);
    setTempDate(new Date(newDate));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(selectedDate!, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 bg-background border shadow-lg relative z-[100]" 
          align="start"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          sideOffset={5}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setOpen(false)} />
          <div className="p-4 relative z-[101] bg-background rounded-md">
            <div className="grid grid-cols-3 gap-4 h-[300px] mb-4">
              <MonthColumn
                currentDate={currentDate}
                tempDate={tempDate}
                onMonthSelect={handleMonthSelect}
              />
              <DayColumn
                tempDate={tempDate}
                onDaySelect={handleDaySelect}
              />
              <YearColumn
                currentDate={currentDate}
                tempDate={tempDate}
                onYearSelect={handleYearSelect}
              />
            </div>

            <DatePickerControls
              onSet={handleSetDate}
              onCancel={() => {
                setTempDate(selectedDate || today);
                setOpen(false);
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
