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
        "rounded-md px-4 py-3 mb-2 cursor-pointer",
        "hover:ring-2 hover:ring-offset-1 hover:ring-blue-500",
        getPriorityColor(task.priority),
        "text-white min-h-[50px] flex items-center"
      )}
      {...dragHandleProps}
    >
      <div className="text-sm font-medium line-clamp-2">
        {task.title}
      </div>
    </div>
  );
}