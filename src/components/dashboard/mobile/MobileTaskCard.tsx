
import { cn } from "@/lib/utils";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { GripVertical } from "lucide-react";
import { getPriorityColor } from "@/utils/taskColors";
import { useTaskAssignmentInfo } from "../task-card/useTaskAssignmentInfo";
import { ShareIndicator } from "../task-card/components/ShareIndicator";
import { TaskAssignmentIcons } from "../task-card/TaskAssignmentIcons";

interface MobileTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps: any;
}

export function MobileTaskCard({ task, onComplete, onClick, dragHandleProps }: MobileTaskCardProps) {
  const assignmentInfo = useTaskAssignmentInfo(task);
  
  const getTimeDisplay = () => {
    if (task.start_time && task.end_time) {
      const startTime = task.start_time.split(':').slice(0, 2).join(':');
      const endTime = task.end_time.split(':').slice(0, 2).join(':');
      return `${startTime} - ${endTime}`;
    }
    return '';
  };

  const timeDisplay = getTimeDisplay();
  
  return (
    <div 
      className={cn(
        "p-4 rounded-lg flex items-center justify-between text-white w-full cursor-pointer mb-2 min-h-[80px] relative",
        task.status === 'unscheduled' ? 'bg-blue-500' : 
        task.status === 'completed' ? 'bg-gray-500' :
        getPriorityColor(task.priority),
        task.shared && "ring-2 ring-[#9b87f5]"
      )}
      onClick={onClick}
    >
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
          {/* Add the TaskAssignmentIcons for mobile to show sharing info */}
          {task.shared && (
            <div className="mt-1">
              <TaskAssignmentIcons 
                task={task} 
                assignmentInfo={assignmentInfo} 
              />
            </div>
          )}
        </div>
      </div>
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
      
      {/* Add ShareIndicator for mobile */}
      {task.shared && (
        <ShareIndicator 
          task={task} 
          assignmentInfo={assignmentInfo} 
        />
      )}
    </div>
  );
}
