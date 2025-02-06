import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { Badge } from "@/components/ui/badge";

interface WeeklyTaskCardProps {
  task: Task;
  onClick?: () => void;
  onComplete?: () => void;
  dragHandleProps?: any;
}

export function WeeklyTaskCard({ task, onClick, onComplete, dragHandleProps }: WeeklyTaskCardProps) {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600';
      case 'medium':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div
      {...dragHandleProps}
      onClick={onClick}
      className={cn(
        "w-full h-full",
        "cursor-pointer",
        "text-white text-xs leading-tight",
        "flex flex-col",
        getPriorityColor(task.priority),
      )}
    >
      <div className="p-1 overflow-hidden">
        <div className="font-medium truncate">
          {task.title}
        </div>
        {task.description && (
          <p className="text-[10px] text-white/90 truncate">
            {task.description}
          </p>
        )}
      </div>
    </div>
  );
}