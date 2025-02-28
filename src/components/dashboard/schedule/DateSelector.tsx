
import { Button } from "@/components/ui/button";
import { PopoverTrigger, PopoverContent, Popover } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Calendar as CalendarLucide } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

interface DateSelectorProps {
  date: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export function DateSelector({ date, onDateChange, className }: DateSelectorProps) {
  const [open, setOpen] = useState(false);
  
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(format(selectedDate, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date 
            ? format(new Date(date), 'MMMM do, yyyy')
            : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white border border-gray-100 shadow-lg rounded-lg" 
        align="start"
        sideOffset={4}
        side="bottom"
      >
        <Calendar
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={handleSelect}
          initialFocus
          className="bg-white p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
