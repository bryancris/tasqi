import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { MobileTaskContent } from "../MobileTaskContent";
import { GripVertical } from "lucide-react";
import { getCompletionDate, getTimeDisplay } from "@/utils/dateUtils";
import { getPriorityColor } from "@/utils/taskColors";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";

interface MobileTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}

export function MobileTaskCard({ task, onComplete, onClick, dragHandleProps }: MobileTaskCardProps) {
  return (
    <div 
      className={cn(
        "p-4 rounded-xl flex items-center justify-between text-white w-full cursor-pointer",
        task.status === 'unscheduled' ? 'bg-blue-500' : 
        task.status === 'completed' ? 'bg-gray-500' :
        getPriorityColor(task.priority)
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div {...dragHandleProps}>
          <GripVertical className="h-5 w-5 text-white/50 cursor-grab" />
        </div>
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