import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";

interface WeeklyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
}

export function WeeklyTaskCard({ task, onComplete, onClick, dragHandleProps }: WeeklyTaskCardProps) {
  return (
    <div 
      className={cn(
        "flex items-start gap-2 p-2 bg-white rounded-md shadow-sm border border-gray-200",
        "hover:shadow-md transition-shadow cursor-pointer text-sm",
        getPriorityColor(task.priority)
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <TaskStatusIndicator 
        status={task.status}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
      </div>
    </div>
  );
}