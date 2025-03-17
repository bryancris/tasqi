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
  
  // CRITICAL FIX: Ensure dropdown shows "At start time" when value is 0
  // This is necessary for consistent UI display
  const handleSelectionChange = (selectedValue: string) => {
    console.log(`💡 User selected value: "${selectedValue}"`);
    
    // Be extra careful with the string "0" value
    if (selectedValue === "0") {
      console.log(`💡 Selected "At start time" option - passing exact value "0"`);
    }
    
    // Pass the value unchanged to parent
    onValueChange(selectedValue);
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="reminderTime">Notify me</Label>
      <Select
        value={value}
        onValueChange={handleSelectionChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {REMINDER_TIME_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value} 
              value={String(option.value)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
