
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { useRef, useEffect } from "react";
import { SharingDetailsHeader } from "./sharing-info/SharingDetailsHeader";
import { SharingDetailsContent } from "./sharing-info/SharingDetailsContent";
import { SharingDetailsList } from "./sharing-info/SharingDetailsList";
import { addEventBlockers } from "@/components/ui/sheet/sheet-utils";
import { isIOSPWA, markSharingSheetClosing, addShieldOverlay } from "@/utils/platform-detection";

/**
 * TaskSharingInfoSheet
 * 
 * This component serves as the main container for displaying detailed task sharing information.
 * It manages the Sheet component lifecycle and coordinates the display of sharing details
 * through smaller, more focused child components.
 * 
 * Key responsibilities:
 * - Managing sheet open/close state
 * - Preventing event propagation when closing to avoid task edit drawer opening
 * - Coordinating the display of sharing information components
 */

interface TaskSharingInfoSheetProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskSharingInfoSheet({ 
  task, 
  assignmentInfo, 
  open, 
  onOpenChange 
}: TaskSharingInfoSheetProps) {
  const uniqueIdRef = useRef<string>(`sharing-sheet-${Date.now()}`);
  const isIOSPwaApp = isIOSPWA();
  const previousOpenState = useRef(open);
  
  // Track when the sheet is transitioning from open to closed
  useEffect(() => {
    // Only run this when the sheet is closing (open changes from true to false)
    if (previousOpenState.current === true && open === false) {
      console.log("📱 Sharing sheet is closing - adding protection");
      
      // Mark this sheet as closing with protection
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Use protection for iOS PWA - but less aggressive
      if (isIOSPwaApp) {
        console.log("📱 iOS PWA: Adding protection for sharing sheet close");
        
        // Add shield overlay with shorter duration
        addShieldOverlay(1500);
        
        // Add selective blocking for iOS PWA
        const blockDuration = 1500; // Reduced from 3000ms
        
        // Block only essential events with more selective criteria
        addEventBlockers(blockDuration, () => {
          console.log("📱 iOS PWA: Event blockers removed after timeout");
          // After delay, clear the closing state
          (window as any).__isClosingSharingSheet = false;
        });
      } else {
        // Standard protection for other platforms
        const blockDuration = 800;
        addEventBlockers(blockDuration, () => {
          (window as any).__isClosingSharingSheet = false;
        });
      }
    }
    
    // Update our ref for the next render
    previousOpenState.current = open;
  }, [open, isIOSPwaApp]);

  // Custom handler for the onOpenChange event - simplified
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Before closing, add protection
      console.log("Sharing sheet closing - adding protection");
      
      // Mark this interaction as a sharing sheet close
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Use less aggressive protection for iOS PWA
      if (isIOSPwaApp) {
        console.log("📱 iOS PWA: Using protection for sharing sheet close");
        
        // Add transparent shield overlay with shorter duration
        addShieldOverlay(1500);
        
        // Block events for a shorter duration and more selectively
        const blockDuration = 1500; // Reduced from 3000ms
        
        // Add selective event blocking - only block task card interactions
        const stopTaskCardEvents = (e: Event) => {
          if (e.target instanceof Element) {
            // Only block interactions with task cards, not with UI controls
            const isTaskCard = e.target.closest('.task-card') || 
                             e.target.closest('[data-task-card]');
                             
            if (isTaskCard) {
              console.log(`📱 Blocking event: ${e.type} on task card`);
              e.stopPropagation();
              if (e.cancelable) e.preventDefault();
              return false;
            }
          }
          return true;
        };
        
        // Only add event listeners for essential events
        document.addEventListener('click', stopTaskCardEvents, { capture: true });
        document.addEventListener('touchstart', stopTaskCardEvents, { capture: true, passive: false });
        
        // Remove the event blockers after delay
        setTimeout(() => {
          document.removeEventListener('click', stopTaskCardEvents, { capture: true });
          document.removeEventListener('touchstart', stopTaskCardEvents, { capture: true });
          
          console.log("📱 iOS PWA: Removed protection event handlers");
        }, blockDuration);
      } else {
        // Less aggressive blocking for non-iOS platforms
        const blockDuration = 800;
        const stopImmediatePropagation = (e: MouseEvent) => {
          // Only block task card interactions
          if (e.target instanceof Element) {
            const isTaskCard = e.target.closest('.task-card') || 
                             e.target.closest('[data-task-card]');
                             
            if (isTaskCard) {
              e.stopPropagation();
              e.preventDefault();
            }
          }
        };
        
        document.addEventListener('click', stopImmediatePropagation, { capture: true });
        
        setTimeout(() => {
          document.removeEventListener('click', stopImmediatePropagation, { capture: true });
        }, blockDuration);
      }
    }
    
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className={`max-h-96 rounded-t-xl z-[60] ${isIOSPwaApp ? 'ios-pwa-sharing-sheet' : ''}`}
        onPointerDownOutside={(e) => {
          // Simplified prevention on pointer events outside the sheet
          e.preventDefault();
          
          if (isIOSPwaApp) {
            console.log("📱 iOS PWA: Pointer outside sharing sheet - adding protection");
            // Add shorter shield overlay for iOS
            addShieldOverlay(1500);
          }
        }}
        // Add a data attribute to help with targeting
        data-sharing-sheet-id={uniqueIdRef.current}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <SharingDetailsHeader task={task} assignmentInfo={assignmentInfo} />
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 space-y-4">
          <SharingDetailsContent task={task} assignmentInfo={assignmentInfo} />
          
          {task.shared && task.shared_tasks && task.shared_tasks.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Sharing Details</h3>
              <SharingDetailsList 
                sharedTasks={task.shared_tasks} 
                currentUserId={assignmentInfo.currentUserId} 
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
