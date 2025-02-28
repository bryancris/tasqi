
import { DatePickerInput } from "@/components/dashboard/form/DatePickerInput";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  date: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export function DateSelector({ date, onDateChange, className }: DateSelectorProps) {
  return (
    <div className={cn("w-full", className)}>
      <DatePickerInput 
        date={date} 
        onDateChange={onDateChange} 
      />
    </div>
  );
}
