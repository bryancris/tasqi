
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { useRef, useEffect, useCallback } from "react";
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
  const uniqueIdRef = useRef<string>(`sharing-sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const isIOSPwaApp = isIOSPWA();
  const previousOpenState = useRef(open);
  
  // Add iOS PWA specific styling classes when sheet is open
  useEffect(() => {
    if (isIOSPwaApp && open) {
      // Add a class to the body to enable additional CSS protection
      document.body.classList.add('ios-pwa-sharing-active');
      
      // Remove the class when the sheet closes or component unmounts
      return () => {
        document.body.classList.remove('ios-pwa-sharing-active');
      };
    }
  }, [isIOSPwaApp, open]);
  
  // Track when the sheet is transitioning from open to closed for extreme protection
  useEffect(() => {
    // Only run this when the sheet is closing (open changes from true to false)
    if (previousOpenState.current === true && open === false) {
      console.log("📱 Sharing sheet is closing - adding EXTREME protection");
      
      // Mark this sheet as closing with extended protection
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Add extreme protection for iOS PWA with a much longer duration
      if (isIOSPwaApp) {
        console.log("📱 iOS PWA: Adding EXTREME protection for sharing sheet close");
        
        // Set extreme protection flags
        (window as any).__extremeProtectionActive = true;
        (window as any).__extremeProtectionStartTime = Date.now();
        
        // Add shield overlay with significantly longer duration
        addShieldOverlay(6000);
        
        const blockTaskCardEvents = (e: Event) => {
          if (e.target instanceof Element) {
            const isTaskCard = e.target.closest('.task-card') || 
                          e.target.closest('[data-task-card]') ||
                          e.target.closest('[role="button"]');
            
            // Allow close button and controls
            const isControl = e.target.closest('[data-sheet-close]') ||
                         e.target.closest('button') ||
                         e.target.closest('[data-radix-dialog-close]');
            
            if (isTaskCard && !isControl) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
        };
        
        document.addEventListener('click', blockTaskCardEvents, { capture: true });
        document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
        
        setTimeout(() => {
          document.removeEventListener('click', blockTaskCardEvents, { capture: true });
          document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        }, 6000);
      }
    }
    
    // Update our ref for the next render
    previousOpenState.current = open;
  }, [open, isIOSPwaApp]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      console.log("Sharing sheet closing via onOpenChange");
      
      markSharingSheetClosing(uniqueIdRef.current);
      
      if (isIOSPwaApp) {
        // Add shield overlay with extended duration
        addShieldOverlay(6000);
        
        const blockTaskCardEvents = (e: Event) => {
          if (e.target instanceof Element) {
            const isTaskCard = e.target.closest('.task-card') || 
                          e.target.closest('[data-task-card]') ||
                          e.target.closest('[role="button"]');
            
            // Allow close button and controls
            const isControl = e.target.closest('[data-sheet-close]') ||
                         e.target.closest('button') ||
                         e.target.closest('[data-radix-dialog-close]');
            
            if (isTaskCard && !isControl) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
        };
        
        document.addEventListener('click', blockTaskCardEvents, { capture: true });
        document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
        
        setTimeout(() => {
          document.removeEventListener('click', blockTaskCardEvents, { capture: true });
          document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
        }, 6000);
      }
    }
    
    onOpenChange(newOpen);
  }, [onOpenChange, isIOSPwaApp]);

  // Force-close the sheet after a delay on iOS PWA
  // This is a fallback mechanism in case normal closing fails
  useEffect(() => {
    if (isIOSPwaApp && open) {
      const closeButtonCheckInterval = setInterval(() => {
        // Check if close button was pressed but sheet didn't close
        const closeButtonPressed = (window as any).__closeButtonPressed;
        const closeButtonPressTime = (window as any).__closeButtonPressTime || 0;
        const timeSincePress = Date.now() - closeButtonPressTime;
        
        if (closeButtonPressed && timeSincePress > 300 && timeSincePress < 5000) {
          console.log("📱 iOS PWA: Detected close button press but sheet still open. Force closing...");
          onOpenChange(false);
          (window as any).__closeButtonPressed = false;
          clearInterval(closeButtonCheckInterval);
        }
      }, 500);
      
      return () => clearInterval(closeButtonCheckInterval);
    }
  }, [isIOSPwaApp, open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className={`max-h-96 rounded-t-xl z-[60] ${isIOSPwaApp ? 'ios-pwa-sharing-sheet' : ''}`}
        data-sharing-sheet-id={uniqueIdRef.current}
        onOpenChange={handleOpenChange}
        onPointerDownOutside={(e) => {
          // Aggressive prevention on pointer events outside the sheet
          e.preventDefault();
          
          if (isIOSPwaApp) {
            console.log("📱 iOS PWA: Pointer outside sharing sheet - adding EXTREME protection");
            
            // Set extreme protection flags
            (window as any).__extremeProtectionActive = true;
            (window as any).__extremeProtectionStartTime = Date.now();
            
            // Add shield overlay for extreme duration
            addShieldOverlay(6000);
            
            const blockTaskCardEvents = (evt: Event) => {
              if (evt.target instanceof Element) {
                const isTaskCard = evt.target.closest('.task-card') || 
                              evt.target.closest('[data-task-card]') ||
                              evt.target.closest('[role="button"]');
                
                if (isTaskCard) {
                  evt.preventDefault();
                  evt.stopPropagation();
                  return false;
                }
              }
            };
            
            document.addEventListener('click', blockTaskCardEvents, { capture: true });
            document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
            
            setTimeout(() => {
              document.removeEventListener('click', blockTaskCardEvents, { capture: true });
              document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
            }, 6000);
          }
        }}
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
