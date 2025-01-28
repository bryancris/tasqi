import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskPriority } from "../TaskBoard";

interface PrioritySelectorProps {
  priority: TaskPriority;
  onPriorityChange: (value: TaskPriority) => void;
}

export function PrioritySelector({ priority, onPriorityChange }: PrioritySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="priority">Priority</Label>
      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger id="priority">
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}