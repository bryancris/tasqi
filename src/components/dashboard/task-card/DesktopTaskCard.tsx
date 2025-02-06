import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";
import { cn } from "@/lib/utils";

interface DesktopTaskCardProps {
  task: Task;
  onComplete?: () => void;
  onClick?: () => void;
  dragHandleProps?: any;
}

export function DesktopTaskCard({ task, onClick, dragHandleProps }: DesktopTaskCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded px-1.5 py-1 mb-0.5 cursor-pointer",
        "hover:ring-2 hover:ring-offset-1 hover:ring-blue-500",
        getPriorityColor(task.priority),
        "text-white"
      )}
      {...dragHandleProps}
    >
      <div className="truncate text-[10px] leading-tight">
        {task.title}
      </div>
    </div>
  );
}