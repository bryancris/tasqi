import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DateSelectorProps {
  date: string;
  onDateChange: (value: string) => void;
}

export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="date">Date</Label>
      <Input
        type="date"
        id="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        required
      />
    </div>
  );
}