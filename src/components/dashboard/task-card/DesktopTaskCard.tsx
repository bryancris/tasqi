import { Task } from "../TaskBoard";
import { getPriorityColor } from "@/utils/taskColors";
import { cn } from "@/lib/utils";
import { getTimeDisplay } from "@/utils/dateUtils";
import { TaskStatusIndicator } from "../TaskStatusIndicator";

interface DesktopTaskCardProps {
  task: Task;
  onClick?: () => void;
  onComplete?: () => void;
  dragHandleProps?: any;
}

export function DesktopTaskCard({ task, onClick, onComplete, dragHandleProps }: DesktopTaskCardProps) {
  const timeDisplay = getTimeDisplay(task);
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg cursor-pointer mb-2 min-h-[80px]",
        "hover:ring-2 hover:ring-offset-1 hover:ring-blue-500",
        task.status === 'unscheduled' ? 'bg-blue-500' : 
        task.status === 'completed' ? 'bg-gray-500' :
        getPriorityColor(task.priority),
        "text-white"
      )}
      {...dragHandleProps}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-medium text-base">{task.title}</h3>
          <p className="text-sm text-white/90">Status: {task.status}</p>
          {timeDisplay && (
            <p className="text-sm text-white/90">{timeDisplay}</p>
          )}
        </div>
        <TaskStatusIndicator
          status={task.status}
          time={timeDisplay}
          onClick={(e) => {
            e.stopPropagation();
            if (task.status !== 'completed' && onComplete) {
              onComplete();
            }
          }}
        />
      </div>
    </div>
  );
}