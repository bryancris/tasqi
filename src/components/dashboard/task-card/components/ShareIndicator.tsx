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

  // Completely rewritten click handler with maximum protection for iOS PWA
  const handleClick = (e: ExtendedMouseEvent) => {
    // Log interaction
    console.log("🔒 ShareIndicator clicked - MAXIMUM protection enabled");
    
    // Set both standard and new extreme global flags
    (window as any).sharingIndicatorClickTime = Date.now();
    (window as any).__sharingProtectionActive = true;
    (window as any).__sharingProtectionStartTime = Date.now();
    
    if (isIOSPwaApp) {
      console.log("🔒 iOS PWA: Setting extreme protection flags");
      (window as any).__extremeProtectionActive = true;
      (window as any).__extremeProtectionStartTime = Date.now();
    }
    
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
    
    // Add document level protection with extreme measures for iOS PWA
    if (isIOSPwaApp) {
      // Create a shield overlay immediately with longer duration
      addShieldOverlay(6000);
      
      // Block task card clicks immediately at document level with multi-layer protection
      const blockTaskCardEvents = (evt: Event) => {
        if (evt.target instanceof Element) {
          // Enhanced task card detection
          const isTaskCard = evt.target.closest('.task-card') || 
                        evt.target.closest('[data-task-card]') ||
                        evt.target.closest('[role="button"]') ||
                        (evt.target.getAttribute && evt.target.getAttribute('data-task-card') === 'true');
          
          // Skip sharing indicator itself
          const isSharingIndicator = evt.target.closest('[data-sharing-indicator="true"]');
          
          if (isTaskCard && !isSharingIndicator) {
            console.log(`📱 iOS PWA: Blocking ${evt.type} on task card after indicator click`);
            evt.preventDefault();
            evt.stopPropagation();
            return false;
          }
        }
      };
      
      // Add multiple layers of blockers with capture
      document.addEventListener('click', blockTaskCardEvents, { capture: true });
      document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
      document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });
      document.addEventListener('mousedown', blockTaskCardEvents, { capture: true });
      
      // Remove in phases for maximum protection
      setTimeout(() => {
        document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
        console.log("📱 iOS PWA: Removed first layer of sharing indicator click blockers");
      }, 4000);
      
      setTimeout(() => {
        document.removeEventListener('click', blockTaskCardEvents, { capture: true });
        document.removeEventListener('mousedown', blockTaskCardEvents, { capture: true });
        console.log("📱 iOS PWA: Removed second layer of sharing indicator click blockers");
        
        // Clear protection flags
        (window as any).__sharingProtectionActive = false;
        (window as any).__extremeProtectionActive = false;
      }, 6000);
    }
    
    // For mobile, show the sharing info sheet with a small delay
    // This helps avoid interaction conflicts during animation
    if (isMobile) {
      // Use setTimeout for more reliable behavior on iOS
      setTimeout(() => {
        setShowSharingInfo(true);
      }, isIOSPwaApp ? 100 : 50);
    }
  };

  // Completely rewritten touch handlers for iOS PWA
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isIOSPwaApp) {
      console.log("🔒 ShareIndicator touchstart on iOS PWA - MAXIMUM protection");
      
      // Prevent default and stop propagation
      e.stopPropagation();
      e.preventDefault();
      
      // Set both standard and extreme protection flags
      (window as any).sharingIndicatorClickTime = Date.now();
      (window as any).__sharingProtectionActive = true;
      (window as any).__sharingProtectionStartTime = Date.now();
      (window as any).__extremeProtectionActive = true;
      (window as any).__extremeProtectionStartTime = Date.now();
      
      // Create an immediate shield overlay with long duration
      addShieldOverlay(6000);
      
      // Set a clear timeout to open the sheet with a slight delay
      // This helps avoid conflicts with other touch events
      setTimeout(() => {
        if (!showSharingInfo) {
          console.log("🔒 iOS PWA: Opening sharing info sheet from touchstart handler");
          setShowSharingInfo(true);
        }
      }, 150);
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
          onTouchEnd={(e) => {
            // Additional touch end handler for iOS PWA
            if (isIOSPwaApp) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
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
