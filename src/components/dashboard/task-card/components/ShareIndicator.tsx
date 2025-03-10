
import { memo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TaskAssignmentInfo } from "../types";
import { Task } from "../../TaskBoard";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskSharingInfoSheet } from "../sharing/TaskSharingInfoSheet";
import { isIOSPWA, addShieldOverlay } from "@/utils/platform-detection";

interface ShareIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

function ShareIndicatorComponent({ task, assignmentInfo }: ShareIndicatorProps) {
  const [showSharingInfo, setShowSharingInfo] = useState(false);
  const isMobile = useIsMobile();
  const isIOSPwaApp = isIOSPWA();
  
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

  // Simplified click handler
  const handleClick = (e: React.MouseEvent) => {
    // Log interaction
    console.log("🔒 ShareIndicator clicked");
    
    // Stop propagation to prevent card click
    e.stopPropagation();
    e.preventDefault();
    
    // Set global timestamp for protection
    (window as any).sharingIndicatorClickTime = Date.now();
    
    // Add shield for iOS PWA with reasonable duration
    if (isIOSPwaApp) {
      addShieldOverlay(2000);
    }
    
    // Show the sharing info sheet with a small delay
    setTimeout(() => {
      setShowSharingInfo(true);
    }, 50);
  };

  // Separated touch handler for better mobile experience
  const handleTouch = (e: React.TouchEvent) => {
    console.log("🔒 ShareIndicator touch detected");
    
    // Stop propagation to prevent card interaction
    e.stopPropagation();
    e.preventDefault();
    
    // Set global timestamp for protection
    (window as any).sharingIndicatorClickTime = Date.now();
    
    // Add shield for iOS PWA with reasonable duration
    if (isIOSPwaApp) {
      addShieldOverlay(2000);
    }
    
    // Show the sharing info sheet with a small delay
    setTimeout(() => {
      setShowSharingInfo(true);
    }, 50);
  };

  return (
    <>
      {isMobile ? (
        <div 
          className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0 rounded-r-xl cursor-pointer sharing-indicator" 
          onClick={handleClick}
          onTouchStart={handleTouch}
          onTouchEnd={(e) => e.stopPropagation()}
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
