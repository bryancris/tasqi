
import { DatePickerInput } from "../form/DatePickerInput";

interface DateSelectorProps {
  date: string;
  onDateChange: (value: string) => void;
}

export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  return (
    <DatePickerInput
      date={date}
      onDateChange={onDateChange}
    />
  );
}
