
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
        
        // Block all task card events
        const blockTaskCardEvents = (e: Event) => {
          if (e.target instanceof Element) {
            // Enhanced task card detection with multiple selectors
            const isTaskCard = e.target.closest('.task-card') || 
                          e.target.closest('[data-task-card]') ||
                          e.target.closest('[role="button"]') ||
                          (e.target.getAttribute && e.target.getAttribute('data-task-card') === 'true');
            
            // Skip controls and sharing indicators
            const isControl = e.target.closest('button') ||
                        e.target.closest('[data-radix-dialog-close]') ||
                        e.target.closest('[data-sharing-indicator="true"]');
            
            if (isTaskCard && !isControl) {
              console.log(`📱 iOS PWA: Blocking ${e.type} on task card with extreme protection`);
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
        };
        
        // Add multiple layers of document-level blockers for maximum protection
        document.addEventListener('click', blockTaskCardEvents, { capture: true });
        document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
        document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });
        document.addEventListener('mousedown', blockTaskCardEvents, { capture: true });
        
        // Remove the event blockers in phases for extended protection
        setTimeout(() => {
          document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
          document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
          console.log("📱 iOS PWA: First layer of event blockers removed after 4000ms");
        }, 4000);
        
        setTimeout(() => {
          document.removeEventListener('click', blockTaskCardEvents, { capture: true });
          document.removeEventListener('mousedown', blockTaskCardEvents, { capture: true });
          console.log("📱 iOS PWA: Second layer of event blockers removed after 6000ms");
          
          // After delay, clear the closing state if it hasn't been reset by something else
          if ((window as any).__lastSheetCloseId === `${uniqueIdRef.current}-${Date.now()}`) {
            (window as any).__isClosingSharingSheet = false;
            (window as any).__extremeProtectionActive = false;
          }
        }, 6000);
      } else {
        // Standard protection for other platforms (still increased)
        const blockDuration = 2500; // Increased from 1500ms
        addEventBlockers(blockDuration, () => {
          (window as any).__isClosingSharingSheet = false;
        });
      }
    }
    
    // Update our ref for the next render
    previousOpenState.current = open;
  }, [open, isIOSPwaApp]);

  // Custom handler for the onOpenChange event with extreme protection
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Before closing, add extreme protection
      console.log("Sharing sheet closing via onOpenChange - adding EXTREME protection");
      
      // Mark this interaction as a sharing sheet close
      markSharingSheetClosing(uniqueIdRef.current);
      
      // Use extreme protection for iOS PWA
      if (isIOSPwaApp) {
        console.log("📱 iOS PWA: Using EXTREME protection for sharing sheet close");
        
        // Set extreme protection flags
        (window as any).__extremeProtectionActive = true;
        (window as any).__extremeProtectionStartTime = Date.now();
        
        // Add aggressive shield overlay with long duration
        addShieldOverlay(6000);
        
        // Block ALL task card events for a long duration
        const blockTaskCardEvents = (e: Event) => {
          if (e.target instanceof Element) {
            // Enhanced task card detection with multiple selectors
            const isTaskCard = e.target.closest('.task-card') || 
                           e.target.closest('[data-task-card]') ||
                           e.target.closest('[role="button"]') ||
                           (e.target.getAttribute && e.target.getAttribute('data-task-card') === 'true');
            
            // Skip controls and sharing indicators
            const isControl = e.target.closest('button') ||
                        e.target.closest('[data-radix-dialog-close]') ||
                        e.target.closest('[data-sharing-indicator="true"]');
                             
            if (isTaskCard && !isControl) {
              console.log(`📱 iOS PWA: Blocking event: ${e.type} on task card with extreme protection`);
              e.stopPropagation();
              if (e.cancelable) e.preventDefault();
              return false;
            }
          }
          return true;
        };
        
        // Add multiple layers of document-level event blockers for maximum protection
        document.addEventListener('click', blockTaskCardEvents, { capture: true });
        document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
        document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });
        document.addEventListener('mousedown', blockTaskCardEvents, { capture: true });
        
        // Remove the event blockers in phases for extended protection
        setTimeout(() => {
          document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
          document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
          console.log("📱 iOS PWA: First layer of event blockers removed after 4000ms");
        }, 4000);
        
        setTimeout(() => {
          document.removeEventListener('click', blockTaskCardEvents, { capture: true });
          document.removeEventListener('mousedown', blockTaskCardEvents, { capture: true });
          console.log("📱 iOS PWA: Second layer of event blockers removed after 6000ms");
        }, 6000);
      } else {
        // Less aggressive blocking for non-iOS platforms (still increased duration)
        const blockDuration = 2500; // Increased from 1500ms
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
          // Aggressive prevention on pointer events outside the sheet
          e.preventDefault();
          
          if (isIOSPwaApp) {
            console.log("📱 iOS PWA: Pointer outside sharing sheet - adding EXTREME protection");
            
            // Set extreme protection flags
            (window as any).__extremeProtectionActive = true;
            (window as any).__extremeProtectionStartTime = Date.now();
            
            // Add shield overlay for extreme duration
            addShieldOverlay(6000);
            
            // Block all task card events with extreme protection
            const blockTaskCardEvents = (evt: Event) => {
              if (evt.target instanceof Element) {
                // Enhanced task card detection with multiple selectors
                const isTaskCard = evt.target.closest('.task-card') || 
                              evt.target.closest('[data-task-card]') ||
                              evt.target.closest('[role="button"]') ||
                              (evt.target.getAttribute && evt.target.getAttribute('data-task-card') === 'true');
                
                if (isTaskCard) {
                  console.log(`📱 iOS PWA: Blocking ${evt.type} on task card from pointer outside handler`);
                  evt.preventDefault();
                  evt.stopPropagation();
                  return false;
                }
              }
            };
            
            // Add multiple layers of document-level blockers
            document.addEventListener('click', blockTaskCardEvents, { capture: true });
            document.addEventListener('touchstart', blockTaskCardEvents, { capture: true, passive: false });
            document.addEventListener('touchend', blockTaskCardEvents, { capture: true, passive: false });
            document.addEventListener('mousedown', blockTaskCardEvents, { capture: true });
            
            // Remove in phases for extended protection
            setTimeout(() => {
              document.removeEventListener('touchstart', blockTaskCardEvents, { capture: true });
              document.removeEventListener('touchend', blockTaskCardEvents, { capture: true });
              console.log(`📱 iOS PWA: First layer of pointer outside blockers removed after 4000ms`);
            }, 4000);
            
            setTimeout(() => {
              document.removeEventListener('click', blockTaskCardEvents, { capture: true });
              document.removeEventListener('mousedown', blockTaskCardEvents, { capture: true });
              console.log(`📱 iOS PWA: Second layer of pointer outside blockers removed after 6000ms`);
              
              // Clear extreme protection flag if it hasn't been reset
              const originTime = (window as any).__extremeProtectionStartTime;
              if (originTime && Date.now() - originTime > 5900) {
                (window as any).__extremeProtectionActive = false;
              }
            }, 6000);
          }
        }}
        // Add a unique data attribute to help with targeting
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
