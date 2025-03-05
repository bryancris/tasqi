
import { DatePickerInput } from "@/components/dashboard/form/DatePickerInput";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  date: string;
  onDateChange: (date: string) => void;
  className?: string;
  hideIcon?: boolean;
}

export function DateSelector({ date, onDateChange, className, hideIcon = false }: DateSelectorProps) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <DatePickerInput 
        date={date} 
        onDateChange={onDateChange}
        hideIcon={hideIcon}
      />
    </div>
  );
}
