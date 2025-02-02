import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";

interface DatePickerInputProps {
  date: string;
  onDateChange: (value: string) => void;
  label?: string;
}

export function DatePickerInput({ date, onDateChange, label = "Date" }: DatePickerInputProps) {
  const selectedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
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
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(newDate) => {
              if (newDate) {
                onDateChange(format(newDate, 'yyyy-MM-dd'));
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}