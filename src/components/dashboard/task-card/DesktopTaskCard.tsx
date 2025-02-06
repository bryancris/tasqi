import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";
import { cn } from "@/lib/utils";
import { getTimeDisplay } from "@/utils/dateUtils";

interface DesktopTaskCardProps {
  task: Task;
  onComplete?: () => void;
  onClick?: () => void;
  dragHandleProps?: any;
}

export function DesktopTaskCard({ task, onClick, dragHandleProps }: DesktopTaskCardProps) {
  const timeDisplay = getTimeDisplay(task);
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-3 mb-3 cursor-pointer",
        "hover:ring-2 hover:ring-offset-1 hover:ring-blue-500",
        getPriorityColor(task.priority),
        "text-white min-h-[80px] flex flex-col justify-center"
      )}
      {...dragHandleProps}
    >
      <div className="text-base font-medium mb-1">
        {task.title}
      </div>
      <div className="text-sm text-white/90">
        Status: {task.status}
      </div>
      {timeDisplay && (
        <div className="text-sm text-white/90">
          {timeDisplay}
        </div>
      )}
    </div>
  );
}