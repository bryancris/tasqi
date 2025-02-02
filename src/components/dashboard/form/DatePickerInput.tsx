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
  const selectedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined;

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
          sideOffset={4}
        >
          <div className="p-3">
            <div className="flex justify-between space-x-2 mb-4">
              <div className="text-sm font-medium">
                {format(selectedDate || new Date(), 'MMMM yyyy')}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  className="h-7 px-3 text-xs"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="h-7 px-3 text-xs"
                  onClick={() => {
                    if (selectedDate) {
                      onDateChange(format(selectedDate, 'yyyy-MM-dd'));
                      setOpen(false);
                    }
                  }}
                >
                  Set
                </Button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(newDate) => {
                if (newDate) {
                  onDateChange(format(newDate, 'yyyy-MM-dd'));
                }
              }}
              defaultMonth={selectedDate || new Date()}
              initialFocus
              className="rounded-md border-0"
              classNames={{
                months: "space-y-4",
                month: "space-y-4",
                caption: "flex justify-between pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 hover:opacity-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-sm",
                row: "flex w-full mt-2",
                cell: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                  "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                ),
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground"
                ),
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}