import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { MobileTaskContent } from "../MobileTaskContent";
import { GripVertical } from "lucide-react";
import { getTimeDisplay } from "@/utils/dateUtils";
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
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-white/50 hover:text-white/75 transition-colors" />
        </div>
        <MobileTaskContent 
          title={task.title}
          time={getTimeDisplay(task)}
          status={task.status}
        />
      </div>
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
  );
}