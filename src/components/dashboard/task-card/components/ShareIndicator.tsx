
import { memo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TaskAssignmentInfo } from "../types";
import { Task } from "../../TaskBoard";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskSharingInfoSheet } from "../sharing/TaskSharingInfoSheet";
import { isIOSPWA } from "@/utils/platform-detection";

interface ShareIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

// Define custom property for mouse events
interface ExtendedMouseEvent extends React.MouseEvent {
  __sharingIndicatorHandled?: boolean;
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

  // Dramatically improved click handler for iOS PWA compatibility
  const handleClick = (e: ExtendedMouseEvent) => {
    // Log interaction
    console.log("ShareIndicator clicked - maximum protection enabled");
    
    // Set global flags
    (window as any).sharingIndicatorClickTime = Date.now();
    (window as any).__sharingProtectionActive = true;
    (window as any).__sharingProtectionStartTime = Date.now();
    
    // Mark event as handled directly on the event
    e.__sharingIndicatorHandled = true;
    
    // Prevent all possible propagation at every level
    e.stopPropagation();
    e.preventDefault();
    
    // Stop native event propagation
    if (e.nativeEvent) {
      if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
      if (e.nativeEvent.stopPropagation) e.nativeEvent.stopPropagation();
      if (e.nativeEvent.preventDefault) e.nativeEvent.preventDefault();
    }
    
    // Add document level protection
    if (isIOSPwaApp) {
      // Block task card clicks immediately at document level
      const blockTaskCardEvents = (evt: Event) => {
        if (evt.target instanceof Element) {
          const isTaskCard = evt.target.closest('.task-card') || 
                        evt.target.closest('[data-task-card]');
          
          if (isTaskCard && !evt.target.closest('[data-sharing-indicator="true"]')) {
            console.log(`📱 iOS PWA: Blocking ${evt.type} on task card after indicator click`);
            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }
        }
      };
      
      // Add blockers with capture
      document.addEventListener('click', blockTaskCardEvents, { capture: true });
      document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
      
      // Remove after longer delay
      setTimeout(() => {
        document.removeEventListener('click', blockTaskCardEvents, { capture: true });
        document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        console.log("📱 iOS PWA: Removed sharing indicator click blockers");
        
        // Clear protection flags
        (window as any).__sharingProtectionActive = false;
      }, 2000);
    }
    
    // For mobile, show the sharing info sheet after a small delay
    if (isMobile) {
      // Use requestAnimationFrame for a smoother transition
      requestAnimationFrame(() => {
        setShowSharingInfo(true);
      });
    }
  };

  // Improved touch handlers for iOS PWA
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isIOSPwaApp) {
      console.log("ShareIndicator touchstart on iOS PWA - maximum protection");
      
      // Prevent default and stop propagation
      e.stopPropagation();
      
      // Skip preventDefault to allow the touch to register
      // But add flags to track this interaction
      (window as any).sharingIndicatorClickTime = Date.now();
      (window as any).__sharingProtectionActive = true;
      (window as any).__sharingProtectionStartTime = Date.now();
      
      // Set a clear timeout to open the sheet with a slight delay
      // This prevents conflicts with other touch events
      setTimeout(() => {
        if (!showSharingInfo) {
          setShowSharingInfo(true);
        }
      }, 50);
    }
  };

  return (
    <>
      {isMobile ? (
        <div 
          className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0 rounded-r-xl cursor-pointer sharing-indicator" 
          onClick={handleClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
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
