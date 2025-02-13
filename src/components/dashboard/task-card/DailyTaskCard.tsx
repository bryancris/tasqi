
import { memo } from "react";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { Bell, Share2, ArrowRight, Users } from "lucide-react";

interface DailyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
  extraButton?: React.ReactNode;
}

function DailyTaskCardComponent({ task, onComplete, onClick, dragHandleProps, extraButton }: DailyTaskCardProps) {
  const timeString = task.start_time && task.end_time ? `${task.start_time} - ${task.end_time}` : '';

  const renderAssigneeInfo = () => {
    if (!task.assignments?.length) return null;
    
    const acceptedAssignments = task.assignments.filter(a => a.status === 'accepted');
    
    if (acceptedAssignments.length === 1) {
      return (
        <div className="flex items-center gap-1 text-white/80">
          <ArrowRight className="w-4 h-4" />
          <span className="text-xs truncate">1 assignee</span>
        </div>
      );
    }
    
    if (acceptedAssignments.length > 1) {
      return (
        <div className="flex items-center gap-1 text-white/80">
          <Users className="w-4 h-4" />
          <span className="text-xs">+{acceptedAssignments.length}</span>
        </div>
      );
    }

    return null;
  };

  const getCardColor = () => {
    if (task.status === 'completed') {
      return 'bg-[#8E9196]'; // Dark gray for completed tasks
    }
    if (task.status === 'unscheduled') {
      return 'bg-[#2196F3]';
    }
    return getPriorityColor(task.priority);
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg shadow-sm relative",
        "hover:shadow-md transition-shadow cursor-pointer",
        getCardColor(),
        task.status === 'completed' ? 'text-white' : '',
        "overflow-hidden"
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <TaskStatusIndicator 
        status={task.status} 
        time={timeString}
        rescheduleCount={task.reschedule_count}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-medium truncate flex-1",
            task.status === 'completed' ? 'text-white line-through' : 'text-gray-900'
          )}>{task.title}</h3>
          <div className="flex items-center gap-2">
            {task.reminder_enabled && (
              <Bell className={cn(
                "w-4 h-4 shrink-0",
                task.status === 'completed' ? 'text-white/80' : 'text-gray-500'
              )} />
            )}
            {task.shared && !task.assignments?.length && (
              <Share2 className="w-4 h-4 text-white/80" />
            )}
            {renderAssigneeInfo()}
            {extraButton}
          </div>
        </div>
        {timeString && (
          <p className={cn(
            "text-sm",
            task.status === 'completed' ? 'text-white/80' : 'text-gray-500'
          )}>{timeString}</p>
        )}
      </div>
      {task.shared && (
        <div className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0" />
      )}
    </div>
  );
}

export const DailyTaskCard = memo(DailyTaskCardComponent);
