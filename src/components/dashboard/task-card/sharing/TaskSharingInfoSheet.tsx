
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { useRef, useEffect } from "react";
import { SharingDetailsHeader } from "./sharing-info/SharingDetailsHeader";
import { SharingDetailsContent } from "./sharing-info/SharingDetailsContent";
import { SharingDetailsList } from "./sharing-info/SharingDetailsList";
import { addEventBlockers } from "@/components/ui/sheet/sheet-utils";

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
  
  // Create a global flag to track when the sheet is closing
  useEffect(() => {
    if (!open) {
      // If the sheet is closing, set global flags and block events
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      
      // Block all events for 1000ms when closing
      addEventBlockers(1000, () => {
        // After delay, clear the closing state
        (window as any).__isClosingSharingSheet = false;
      });
    }
  }, [open]);

  // Custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Before closing, add protection
      console.log("Sharing sheet closing - adding protection");
      
      // Mark this interaction as a sharing sheet close
      (window as any).__closingSharingSheet = uniqueIdRef.current;
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      
      // Block click events for 1200ms (longer than animation)
      const stopImmediatePropagation = (e: MouseEvent) => {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      };
      
      document.addEventListener('click', stopImmediatePropagation, { capture: true });
      
      // Remove the event blocker and clean up global flags after delay
      setTimeout(() => {
        document.removeEventListener('click', stopImmediatePropagation, { capture: true });
        
        // Reset all flags
        if ((window as any).__closingSharingSheet === uniqueIdRef.current) {
          (window as any).__closingSharingSheet = null;
          (window as any).__isClosingSharingSheet = false;
        }
      }, 1200);
    }
    
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className="max-h-96 rounded-t-xl z-[60]"
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
