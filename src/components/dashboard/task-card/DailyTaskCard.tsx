
import { memo } from "react";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { getPriorityColor } from "@/utils/taskColors";
import { Bell, Share2, ArrowRight, Users, Mic } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface DailyTaskCardProps {
  task: Task;
  onComplete: () => void;
  onClick: () => void;
  dragHandleProps?: any;
  extraButton?: React.ReactNode;
}

function DailyTaskCardComponent({ task, onComplete, onClick, dragHandleProps, extraButton }: DailyTaskCardProps) {
  const getTimeDisplay = () => {
    if (task.start_time && task.end_time) {
      const startTime = task.start_time.split(':').slice(0, 2).join(':');
      const endTime = task.end_time.split(':').slice(0, 2).join(':');
      return `${startTime} - ${endTime}`;
    }
    return '';
  };

  const hasVoiceNote = task.task_attachments?.some(
    attachment => attachment.content_type === 'audio/webm'
  );

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

  const getAssignerName = () => {
    if (!task.assignments?.length) return "Shared task";
    const assignment = task.assignments[0]; // Get the first assignment
    return `Assigned by ${assignment.assigned_by_id}`;
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

  const timeDisplay = getTimeDisplay();

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl relative",
        "transition-all duration-300",
        "shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
        "hover:-translate-y-1",
        "cursor-pointer",
        getCardColor(),
        "text-white",
        "before:content-[''] before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
        "before:pointer-events-none",
        "border border-white/20"
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <TaskStatusIndicator 
        status={task.status} 
        time={getTimeDisplay()}
        rescheduleCount={task.reschedule_count}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-medium truncate flex-1 text-white",
            task.status === 'completed' && "line-through opacity-80"
          )}>{task.title}</h3>
          <div className="flex items-center gap-2">
            {task.reminder_enabled && (
              <Bell className="w-4 h-4 text-white/80 shrink-0" />
            )}
            {hasVoiceNote && (
              <Mic className="w-4 h-4 text-white/80" />
            )}
            {task.shared && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Share2 className="w-4 h-4 text-white/80 cursor-help relative z-10" />
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-gray-800 text-white border-gray-700 text-xs z-50"
                    sideOffset={5}
                  >
                    {getAssignerName()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {renderAssigneeInfo()}
            {extraButton}
          </div>
        </div>
        {timeDisplay && (
          <p className="text-sm mt-1 text-white/80">{timeDisplay}</p>
        )}
      </div>
      {task.shared && (
        <div className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0" />
      )}
    </div>
  );
}

export const DailyTaskCard = memo(DailyTaskCardComponent);
