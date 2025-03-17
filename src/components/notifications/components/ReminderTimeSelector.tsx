
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REMINDER_TIME_OPTIONS } from "../constants/reminderTimeOptions";

interface ReminderTimeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ReminderTimeSelector({
  value,
  onValueChange
}: ReminderTimeSelectorProps) {
  // Special debug for the "At start time" case
  console.log(`💡 ReminderTimeSelector rendering with value="${value}" (${typeof value})`);
  console.log(`💡 Is "At start time"? ${value === "0" ? "YES" : "NO"}`);

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="reminderTime">Notify me</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {REMINDER_TIME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
