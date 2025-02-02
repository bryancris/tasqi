import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { Button } from "@/components/ui/button";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { GripVertical } from "lucide-react";
import { getCompletionDate, getTimeDisplay } from "@/utils/dateUtils";
import { getPriorityColor } from "@/utils/taskColors";

interface DesktopTaskCardProps {
  task: Task;
  onComplete: () => void;
}

export function DesktopTaskCard({ task, onComplete }: DesktopTaskCardProps) {
  return (
    <div 
      className={cn(
        "p-4 rounded-lg flex items-center justify-between text-white",
        task.status === 'unscheduled' ? 'bg-blue-500' : 
        task.status === 'completed' ? 'bg-gray-500' :
        getPriorityColor(task.priority)
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="h-5 w-5 text-white/50 cursor-grab" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className={cn("font-medium", task.status === 'completed' && "line-through")}>
              {task.title}
            </h3>
            {task.status === 'scheduled' && (
              <span className="text-sm">{getTimeDisplay(task)}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className={cn("text-sm mt-1 capitalize", task.status === 'completed' && "line-through")}>
              Status: {task.status}
            </p>
            {task.status === 'completed' && task.completed_at && (
              <span className="text-sm text-white/80">
                Completed {getCompletionDate(task)}
              </span>
            )}
          </div>
        </div>
      </div>
      {task.status !== 'completed' && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <TaskStatusIndicator
            status={task.status}
            time={getTimeDisplay(task)}
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
          />
        </Button>
      )}
    </div>
  );
}