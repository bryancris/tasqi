import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { MobileTaskContent } from "../MobileTaskContent";
import { GripVertical } from "lucide-react";
import { getCompletionDate, getTimeDisplay } from "@/utils/dateUtils";
import { getPriorityColor } from "@/utils/taskColors";

interface MobileTaskCardProps {
  task: Task;
  onComplete: () => void;
}

export function MobileTaskCard({ task, onComplete }: MobileTaskCardProps) {
  return (
    <div 
      className={cn(
        "p-4 rounded-xl flex items-center justify-between text-white w-full",
        task.status === 'unscheduled' ? 'bg-blue-500' : 
        task.status === 'completed' ? 'bg-gray-500' :
        getPriorityColor(task.priority)
      )}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-white/50 cursor-grab" />
        <MobileTaskContent 
          title={task.title}
          time={getTimeDisplay(task)}
          status={task.status}
        />
      </div>
      <div className="flex flex-col items-end">
        {task.status === 'completed' && task.completed_at && (
          <span className="text-xs text-white/80">
            Completed {getCompletionDate(task)}
          </span>
        )}
        <TaskStatusIndicator
          status={task.status}
          time={getTimeDisplay(task)}
          onClick={(e) => {
            e.stopPropagation();
            if (task.status !== 'completed') {
              onComplete();
            }
          }}
        />
      </div>
    </div>
  );
}