import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse, addMonths } from "date-fns";
import { useState } from "react";

interface DatePickerInputProps {
  date: string;
  onDateChange: (value: string) => void;
  label?: string;
}

export function DatePickerInput({ date, onDateChange, label = "Date" }: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(
    date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined
  );
  
  const selectedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined;
  const currentDate = new Date();

  // Generate arrays for months, days, and years
  const months = Array.from({ length: 5 }, (_, i) => 
    format(addMonths(new Date(currentDate.getFullYear(), currentDate.getMonth() - 2), i), 'MMM')
  );
  
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  
  const years = Array.from({ length: 10 }, (_, i) => 
    String(currentDate.getFullYear() - 5 + i)
  );

  const handleSetDate = () => {
    if (tempDate) {
      onDateChange(format(tempDate, 'yyyy-MM-dd'));
    }
    setOpen(false);
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
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto mb-4">
              {/* Months Column */}
              <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium mb-2 text-center">Month</div>
                {months.map((month) => (
                  <button
                    key={month}
                    className={cn(
                      "px-4 py-2 text-sm text-center hover:bg-accent rounded-md transition-colors",
                      tempDate && format(tempDate, 'MMM') === month && "bg-[#1e1b4b] text-white"
                    )}
                    onClick={() => {
                      const newDate = tempDate || new Date();
                      const monthIndex = months.indexOf(month);
                      const targetDate = addMonths(new Date(currentDate.getFullYear(), currentDate.getMonth() - 2), monthIndex);
                      newDate.setMonth(targetDate.getMonth());
                      setTempDate(new Date(newDate));
                    }}
                  >
                    {month}
                  </button>
                ))}
              </div>

              {/* Days Column */}
              <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium mb-2 text-center">Day</div>
                {days.map((day) => (
                  <button
                    key={day}
                    className={cn(
                      "px-4 py-2 text-sm text-center hover:bg-accent rounded-md transition-colors",
                      tempDate && format(tempDate, 'dd') === day && "bg-[#1e1b4b] text-white"
                    )}
                    onClick={() => {
                      const newDate = tempDate || new Date();
                      newDate.setDate(parseInt(day));
                      setTempDate(new Date(newDate));
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Years Column */}
              <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium mb-2 text-center">Year</div>
                {years.map((year) => (
                  <button
                    key={year}
                    className={cn(
                      "px-4 py-2 text-sm text-center hover:bg-accent rounded-md transition-colors",
                      tempDate && format(tempDate, 'yyyy') === year && "bg-[#1e1b4b] text-white"
                    )}
                    onClick={() => {
                      const newDate = tempDate || new Date();
                      newDate.setFullYear(parseInt(year));
                      setTempDate(new Date(newDate));
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-4 gap-4">
              <Button
                variant="default"
                className="flex-1 bg-[#1e1b4b] hover:bg-[#1e1b4b]/90"
                onClick={handleSetDate}
              >
                Set
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-[#1e1b4b] hover:bg-[#1e1b4b]/90"
                onClick={() => {
                  setTempDate(selectedDate);
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}