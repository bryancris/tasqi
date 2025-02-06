import { Task } from "../TaskBoard";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";

interface WeeklyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
}

export function WeeklyTaskCard({ task, onClick, dragHandleProps }: WeeklyTaskCardProps) {
  return (
    <div 
      className={cn(
        "px-1 py-0.5 rounded-md mb-0.5",
        "text-[10px] leading-tight",
        "text-white break-words",
        "h-full cursor-move",
        getPriorityColor(task.priority)
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <div className="font-medium line-clamp-2">{task.title}</div>
    </div>
  );
}