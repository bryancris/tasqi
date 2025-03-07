
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { useRef, useEffect } from "react";
import { SharingDetailsHeader } from "./sharing-info/SharingDetailsHeader";
import { SharingDetailsContent } from "./sharing-info/SharingDetailsContent";
import { SharingDetailsList } from "./sharing-info/SharingDetailsList";

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
  
  // When the sheet opens or closes, handle event prevention
  useEffect(() => {
    if (!open && preventClickRef.current) {
      const blockAllEvents = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
        return false;
      };
      
      // Block all types of events that might lead to unwanted interactions
      document.addEventListener('click', blockAllEvents, { capture: true });
      document.addEventListener('mousedown', blockAllEvents, { capture: true });
      document.addEventListener('mouseup', blockAllEvents, { capture: true });
      document.addEventListener('pointerdown', blockAllEvents, { capture: true });
      document.addEventListener('pointerup', blockAllEvents, { capture: true });
      
      // Remove blocks after a delay
      const timeoutId = setTimeout(() => {
        document.removeEventListener('click', blockAllEvents, { capture: true });
        document.removeEventListener('mousedown', blockAllEvents, { capture: true });
        document.removeEventListener('mouseup', blockAllEvents, { capture: true });
        document.removeEventListener('pointerdown', blockAllEvents, { capture: true });
        document.removeEventListener('pointerup', blockAllEvents, { capture: true });
        preventClickRef.current = false;
      }, 500);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', blockAllEvents, { capture: true });
        document.removeEventListener('mousedown', blockAllEvents, { capture: true });
        document.removeEventListener('mouseup', blockAllEvents, { capture: true });
        document.removeEventListener('pointerdown', blockAllEvents, { capture: true });
        document.removeEventListener('pointerup', blockAllEvents, { capture: true });
      };
    }
  }, [open]);

  // Custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Set the prevention flag when sheet is being closed
      preventClickRef.current = true;
      
      // Mark this interaction as a sharing sheet close
      (window as any).__closingSharingSheet = uniqueIdRef.current;
      
      // Remove the marker after a delay
      setTimeout(() => {
        if ((window as any).__closingSharingSheet === uniqueIdRef.current) {
          (window as any).__closingSharingSheet = null;
        }
      }, 500);
    }
    
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className="max-h-96 rounded-t-xl"
        onPointerDownOutside={(e) => {
          // Additional direct prevention on pointer events outside the sheet
          e.preventDefault();
          e.stopPropagation();
        }}
        onInteractOutside={(e) => {
          // Prevent any kind of outside interaction from propagating
          e.preventDefault();
          e.stopPropagation();
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
