
import { Label } from "@/components/ui/label";
import { TaskPriority } from "../TaskBoard";

interface PrioritySelectorProps {
  priority: TaskPriority;
  onPriorityChange: (value: TaskPriority) => void;
}

export function PrioritySelector({ priority, onPriorityChange }: PrioritySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="priority">Priority</Label>
      <select
        id="priority"
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as TaskPriority)}
        className="w-full rounded-md border border-input bg-background px-3 py-2"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
  );
}
