
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { useEffect, useRef } from "react";
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
  const ignoreClickRef = useRef(false);
  
  // Use effect to set a flag that will prevent the task edit drawer from opening
  // when this sheet is closed
  useEffect(() => {
    if (!open && ignoreClickRef.current) {
      // This runs after the sheet is closed
      // Set a timeout to reset the flag after all event handlers have run
      const timeout = setTimeout(() => {
        ignoreClickRef.current = false;
      }, 100);
      
      return () => clearTimeout(timeout);
    }
    
    if (open) {
      // When sheet is opened, set the flag to true
      ignoreClickRef.current = true;
    }
  }, [open]);

  // Create a custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    // Prevent click events from bubbling when sheet is being closed
    if (!newOpen) {
      // Intercept and prevent other click/touch events for a short period
      document.body.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
      }, { capture: true, once: true });
    }
    
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-96 rounded-t-xl">
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
