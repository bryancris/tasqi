
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
  const preventClickRef = useRef(false);
  const uniqueIdRef = useRef<string>(`sharing-sheet-${Date.now()}`);
  
  // When the component mounts, store its ID in a global registry
  useEffect(() => {
    // Create a global registry if it doesn't exist
    if (typeof window !== 'undefined') {
      (window as any).__activeSharingSheets = (window as any).__activeSharingSheets || {};
      (window as any).__activeSharingSheets[uniqueIdRef.current] = true;
      
      return () => {
        // Clean up registry on unmount
        if ((window as any).__activeSharingSheets) {
          delete (window as any).__activeSharingSheets[uniqueIdRef.current];
        }
      };
    }
  }, []);
  
  // Setup a pre-close handler to block events BEFORE the sheet starts closing
  useEffect(() => {
    if (!open && preventClickRef.current) {
      // Add event blocker immediately when sheet is about to close
      const cleanup = addEventBlockers(800, () => {
        preventClickRef.current = false;
      });
      
      return cleanup;
    }
  }, [open]);

  // Custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Before closing, add protection
      console.log("Sharing sheet closing - adding protection");
      
      // Set the prevention flag when sheet is being closed
      preventClickRef.current = true;
      
      // Mark this interaction as a sharing sheet close
      (window as any).__closingSharingSheet = uniqueIdRef.current;
      (window as any).__isClosingSharingSheet = true;
      
      // Block any pending click events
      const stopImmediatePropagation = (e: MouseEvent) => {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
      };
      
      document.addEventListener('click', stopImmediatePropagation, { capture: true });
      
      // Remove the marker and event blocker after a delay
      setTimeout(() => {
        if ((window as any).__closingSharingSheet === uniqueIdRef.current) {
          (window as any).__closingSharingSheet = null;
          (window as any).__isClosingSharingSheet = false;
        }
        document.removeEventListener('click', stopImmediatePropagation, { capture: true });
      }, 800);
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
