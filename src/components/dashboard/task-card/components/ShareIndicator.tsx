
import { memo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TaskAssignmentInfo } from "../types";
import { Task } from "../../TaskBoard";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskSharingInfoSheet } from "../sharing/TaskSharingInfoSheet";

interface ShareIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

function ShareIndicatorComponent({ task, assignmentInfo }: ShareIndicatorProps) {
  const [showSharingInfo, setShowSharingInfo] = useState(false);
  const isMobile = useIsMobile();
  
  if (!task.shared) return null;

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

  // Simple click handler that sets a global flag and shows the sheet on mobile
  const handleClick = (e: React.MouseEvent) => {
    // Set the global sharing indicator flag with timestamp
    window.__sharingIndicatorClickTime = Date.now();
    
    // Mark event as handled by sharing indicator
    e.__sharingIndicatorHandled = true;
    
    // Add a data attribute for easier identification
    (e.target as HTMLElement).setAttribute('data-sharing-indicator-clicked', 'true');
    
    // Stop propagation at all levels
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    // For mobile, show the sharing info sheet
    if (isMobile) {
      setShowSharingInfo(true);
    }
  };

  return (
    <>
      {isMobile ? (
        <div 
          className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0 rounded-r-xl cursor-pointer sharing-indicator" 
          onClick={handleClick}
          onMouseDown={(e) => e.stopPropagation()}
          data-sharing-indicator="true"
          aria-label="Sharing information"
        />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0 rounded-r-xl cursor-help sharing-indicator" 
                onClick={handleClick}
                onMouseDown={(e) => e.stopPropagation()}
                data-sharing-indicator="true"
                aria-label="Sharing information"
              />
            </TooltipTrigger>
            <TooltipContent 
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              side="left"
              sideOffset={5}
              data-sharing-indicator="true"
            >
              {getShareTooltipText()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <TaskSharingInfoSheet
        task={task}
        assignmentInfo={assignmentInfo}
        open={showSharingInfo}
        onOpenChange={setShowSharingInfo}
      />
    </>
  );
}

export const ShareIndicator = memo(ShareIndicatorComponent);
