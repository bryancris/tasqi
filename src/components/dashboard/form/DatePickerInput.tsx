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
              classNames={{
                months: "space-y-4",
                month: "space-y-4",
                caption: "flex justify-between pt-1 relative items-center px-2",
                caption_label: "text-base font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 hover:opacity-100 hover:bg-transparent"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm relative p-0 [&:has([aria-selected])]:bg-[#1e1b4b] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  "hover:bg-accent hover:text-accent-foreground rounded-full",
                  "focus:bg-accent focus:text-accent-foreground focus:rounded-full"
                ),
                day_selected: 
                  "bg-[#1e1b4b] text-white hover:bg-[#1e1b4b] hover:text-white focus:bg-[#1e1b4b] focus:text-white rounded-full",
                day_today: "bg-accent text-accent-foreground rounded-full",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
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