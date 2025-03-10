
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { useRef, useEffect } from "react";
import { SharingDetailsHeader } from "./sharing-info/SharingDetailsHeader";
import { SharingDetailsContent } from "./sharing-info/SharingDetailsContent";
import { SharingDetailsList } from "./sharing-info/SharingDetailsList";
import { addEventBlockers } from "@/components/ui/sheet/sheet-utils";
import { isIOSPWA, markSharingSheetClosing } from "@/utils/platform-detection";

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
  
  // Create a global flag to track when the sheet is closing
  useEffect(() => {
    if (!open) {
      // If the sheet is closing, set global flags and block events
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Add platform-specific blocking duration - longer for iOS PWA
      const blockDuration = isIOSPwaApp ? 2000 : 1000;
      
      // Block all events when closing
      addEventBlockers(blockDuration, () => {
        // After delay, clear the closing state
        (window as any).__isClosingSharingSheet = false;
      });
      
      // For iOS PWA, we need extra protection against the edit drawer opening
      if (isIOSPwaApp) {
        console.log("iOS PWA: Adding extra protection for sharing sheet close");
        
        // Lock the screen briefly with a transparent overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.zIndex = '999';
        overlay.style.backgroundColor = 'transparent';
        overlay.setAttribute('data-sharing-shield', 'true');
        document.body.appendChild(overlay);
        
        // Remove the overlay after a delay
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        }, 300);
      }
    }
  }, [open, isIOSPwaApp]);

  // Custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Before closing, add protection
      console.log("Sharing sheet closing - adding protection");
      
      // Mark this interaction as a sharing sheet close
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Block click events - longer duration for iOS PWA
      const blockDuration = isIOSPwaApp ? 2000 : 1200;
      const stopImmediatePropagation = (e: MouseEvent) => {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      };
      
      document.addEventListener('click', stopImmediatePropagation, { capture: true });
      
      // Remove the event blocker and clean up global flags after delay
      setTimeout(() => {
        document.removeEventListener('click', stopImmediatePropagation, { capture: true });
      }, blockDuration);
      
      // For iOS PWA, prevent touchstart events which can trigger drawer opening
      if (isIOSPwaApp) {
        const blockTouchStart = (e: TouchEvent) => {
          if (e.target instanceof Element) {
            // Only block touchstart on the main interface, not on control elements
            if (!e.target.closest('button') && !e.target.closest('[role="button"]')) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        };
        
        document.addEventListener('touchstart', blockTouchStart, { capture: true });
        
        setTimeout(() => {
          document.removeEventListener('touchstart', blockTouchStart, { capture: true });
        }, 500);
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
