import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
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
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
        >
          <div className="p-4">
            <Calendar
              mode="single"
              selected={tempDate}
              onSelect={setTempDate}
              defaultMonth={selectedDate || new Date()}
              initialFocus
              className="rounded-md border-0"
            />
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