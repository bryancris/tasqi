
import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { MobileTaskContent } from "../MobileTaskContent";
import { GripVertical } from "lucide-react";
import { getTimeDisplay } from "@/utils/dateUtils";
import { getPriorityColor } from "@/utils/taskColors";

interface MobileTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps: any;
}

export function MobileTaskCard({ task, onComplete, onClick, dragHandleProps }: MobileTaskCardProps) {
  const timeDisplay = getTimeDisplay(task);
  
  return (
    <div 
      className={cn(
        "rounded-lg flex items-stretch text-white w-full cursor-pointer mb-2 min-h-[80px] overflow-hidden",
        task.status === 'unscheduled' ? 'bg-blue-500' : 
        task.status === 'completed' ? 'bg-gray-500' :
        getPriorityColor(task.priority),
        task.shared && "ring-10 ring-[#8B5CF6]"
      )}
      onClick={onClick}
    >
      <div className="flex-1 p-4">
        <div className="flex items-center gap-4 flex-1">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing touch-none">
            <GripVertical className="h-5 w-5 text-white/50 hover:text-white/75 transition-colors" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-medium text-base">{task.title}</h3>
            <p className="text-sm text-white/90">Status: {task.status}</p>
            {timeDisplay && (
              <p className="text-sm text-white/90">{timeDisplay}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <TaskStatusIndicator
          status={task.status}
          time={timeDisplay}
          onClick={(e) => {
            e.stopPropagation();
            if (task.status !== 'completed') {
              onComplete();
            }
          }}
        />
        {task.shared && (
          <div className="w-8 bg-[#8B5CF6] h-full" />
        )}
      </div>
    </div>
  );
}
