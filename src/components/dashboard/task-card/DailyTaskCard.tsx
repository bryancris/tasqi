
import { memo } from "react";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { Bell, Mic } from "lucide-react";
import { TaskCardProps } from "./types";
import { useTaskAssignmentInfo } from "./useTaskAssignmentInfo";
import { TaskAssignmentIcons } from "./TaskAssignmentIcons";
import { getTimeDisplay, getCardColor, hasVoiceNote } from "./taskCardUtils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

function DailyTaskCardComponent({ task, onComplete, onClick, dragHandleProps, extraButton }: TaskCardProps) {
  const assignmentInfo = useTaskAssignmentInfo(task);
  const timeDisplay = getTimeDisplay(task);
  const hasAudioAttachment = hasVoiceNote(task);

  // Function to determine the tooltip text based on assignment info
  const getShareTooltipText = () => {
    const {
      assignerName,
      assigneeName,
      sharedWithUser,
      sharedByUser,
      sharedWithName,
      sharedByName,
      currentUserId
    } = assignmentInfo;

    console.log("Assignment info for tooltip:", {
      assignerName,
      assigneeName,
      sharedWithUser,
      sharedByUser,
      sharedWithName,
      sharedByName,
      assignments: task.assignments,
      shared_tasks: task.shared_tasks
    });

    // Check for assignments first
    if (task.assignments?.length > 0) {
      const assignment = task.assignments[0];
      
      // If current user assigned this task to someone else
      if (assignment.assigned_by_id === currentUserId) {
        return `Assigned to ${assigneeName || 'someone'}`;
      }
      
      // If task was assigned to current user
      if (assignment.assignee_id === currentUserId) {
        return `Assigned by ${assignerName || 'someone'}`;
      }
    }
    
    // If current user shared this task with someone else
    if (sharedByUser && sharedWithName) {
      return `Shared with ${sharedWithName}`;
    }
    
    // If task was shared with current user by someone else
    if (sharedWithUser && sharedByName) {
      return `Shared by ${sharedByName}`;
    }
    
    // If we have direct sharing information but not specifically about current user
    if (sharedByName && sharedWithName) {
      return `Shared by ${sharedByName} with ${sharedWithName}`;
    }
    
    // If we know who shared it but not with whom
    if (sharedByName) {
      return `Shared by ${sharedByName}`;
    }
    
    // If we know who it was shared with but not by whom
    if (sharedWithName) {
      return `Shared with ${sharedWithName}`;
    }
    
    // Check if it's a group share
    if (task.shared_tasks?.some?.(st => st.sharing_type === 'group')) {
      return "Shared with group";
    }
    
    // Generic fallback
    return "Shared task";
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl relative",
        "transition-all duration-300",
        "shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
        "hover:-translate-y-1",
        "cursor-pointer",
        getCardColor(task),
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
        time={timeDisplay}
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
              <Bell className="w-4 h-4 text-white shrink-0" />
            )}
            {hasAudioAttachment && (
              <Mic className="w-4 h-4 text-white" />
            )}
            <TaskAssignmentIcons 
              task={task} 
              assignmentInfo={assignmentInfo} 
            />
            {extraButton}
          </div>
        </div>
        {timeDisplay && (
          <p className="text-sm mt-1 text-white/80">{timeDisplay}</p>
        )}
      </div>
      {task.shared && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0 rounded-r-xl cursor-help" />
            </TooltipTrigger>
            <TooltipContent 
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              side="left"
              sideOffset={5}
            >
              {getShareTooltipText()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export const DailyTaskCard = memo(DailyTaskCardComponent);
