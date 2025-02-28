import { Button } from "@/components/ui/button";
import { PopoverTrigger, PopoverContent, Popover } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface DateSelectorProps {
  date: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export function DateSelector({ date, onDateChange, className }: DateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? new Date(date) : undefined
  );
  
  useEffect(() => {
    if (date) {
      setSelectedDate(new Date(date));
    } else {
      setSelectedDate(undefined);
    }
  }, [date]);
  
  const handleSelect = (newDate: Date | undefined) => {
    console.log("Date selected:", newDate);
    setSelectedDate(newDate);
    
    if (newDate) {
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      console.log("Formatted date to pass to parent:", formattedDate);
      onDateChange(formattedDate);
      
      setTimeout(() => {
        setOpen(false);
      }, 300);
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
          {selectedDate 
            ? format(selectedDate, 'MMMM do, yyyy')
            : "Select date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white border border-gray-100 shadow-lg rounded-lg z-[200]" 
        align="start"
        sideOffset={4}
        side="bottom"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          className="bg-white p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
