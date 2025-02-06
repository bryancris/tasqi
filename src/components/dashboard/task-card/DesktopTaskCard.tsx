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
        "rounded px-1.5 py-1 mb-0.5 cursor-pointer", // Reduced padding
        "hover:ring-2 hover:ring-offset-1 hover:ring-blue-500",
        getPriorityColor(task.priority),
        "text-white"
      )}
      {...dragHandleProps}
    >
      <div className="truncate text-[10px] leading-tight"> {/* Smaller font and tighter leading */}
        {task.title}
      </div>
      {task.start_time && (
        <div className="text-[9px] opacity-90"> {/* Even smaller time display */}
          {task.start_time.substring(0, 5)}
        </div>
      )}
    </div>
  );
}