
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
      
      // Mark this sheet as closing with enhanced protection
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Use our extreme protection for iOS PWA
      if (isIOSPwaApp) {
        console.log("📱 iOS PWA: Adding extreme protection for sharing sheet close");
        
        // Add shield overlay with extended duration
        addShieldOverlay(3500);
        
        // Add platform-specific blocking - extra aggressive for iOS PWA
        const blockDuration = 3000; // Much longer than before
        
        // Block all events when closing with our most aggressive blocker
        addEventBlockers(blockDuration, () => {
          console.log("📱 iOS PWA: Event blockers removed after timeout");
          // After delay, clear the closing state
          (window as any).__isClosingSharingSheet = false;
        });
      } else {
        // Standard protection for other platforms
        const blockDuration = 1500;
        addEventBlockers(blockDuration, () => {
          (window as any).__isClosingSharingSheet = false;
        });
      }
    }
    
    // Update our ref for the next render
    previousOpenState.current = open;
  }, [open, isIOSPwaApp]);

  // Custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Before closing, add protection
      console.log("Sharing sheet closing - adding protection");
      
      // Mark this interaction as a sharing sheet close
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Use extreme protection for iOS PWA
      if (isIOSPwaApp) {
        console.log("📱 iOS PWA: Using extreme protection for sharing sheet close");
        
        // Add transparent shield overlay with longer duration
        addShieldOverlay(3500);
        
        // Block events with a very long duration
        const blockDuration = 3000;
        
        // Add aggressive event blocking on all interaction types
        const stopAllEvents = (e: Event) => {
          console.log(`📱 Blocking event: ${e.type}`);
          e.stopImmediatePropagation();
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          return false;
        };
        
        document.addEventListener('click', stopAllEvents, { capture: true });
        document.addEventListener('mousedown', stopAllEvents, { capture: true });
        document.addEventListener('mouseup', stopAllEvents, { capture: true });
        document.addEventListener('touchstart', stopAllEvents, { capture: true, passive: false });
        document.addEventListener('touchend', stopAllEvents, { capture: true, passive: false });
        document.addEventListener('touchmove', stopAllEvents, { capture: true, passive: false });
        document.addEventListener('pointerdown', stopAllEvents, { capture: true });
        document.addEventListener('pointerup', stopAllEvents, { capture: true });
        
        // Remove the event blockers after delay
        setTimeout(() => {
          document.removeEventListener('click', stopAllEvents, { capture: true });
          document.removeEventListener('mousedown', stopAllEvents, { capture: true });
          document.removeEventListener('mouseup', stopAllEvents, { capture: true });
          document.removeEventListener('touchstart', stopAllEvents, { capture: true });
          document.removeEventListener('touchend', stopAllEvents, { capture: true });
          document.removeEventListener('touchmove', stopAllEvents, { capture: true });
          document.removeEventListener('pointerdown', stopAllEvents, { capture: true });
          document.removeEventListener('pointerup', stopAllEvents, { capture: true });
          
          console.log("📱 iOS PWA: Removed extreme protection event handlers");
        }, blockDuration);
      } else {
        // Less aggressive blocking for non-iOS platforms
        const blockDuration = 1500;
        const stopImmediatePropagation = (e: MouseEvent) => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          e.preventDefault();
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
          // Additional direct prevention on pointer events outside the sheet
          e.preventDefault();
          
          if (isIOSPwaApp) {
            console.log("📱 iOS PWA: Pointer outside sharing sheet - adding protection");
            // Add the shield overlay for iOS
            addShieldOverlay(3500);
          }
        }}
        // Add a data attribute to help with targeting specific elements in event handlers
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
