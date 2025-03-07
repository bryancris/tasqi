
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
  
  // When the sheet closes, we need to prevent the next click from opening the task drawer
  useEffect(() => {
    if (!open && preventClickRef.current) {
      // Create a one-time event blocker that captures and stops all click events
      const clickBlocker = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Remove itself after execution
        document.removeEventListener('click', clickBlocker, true);
        preventClickRef.current = false;
      };
      
      // Add the blocker with capture phase to ensure it runs before other handlers
      document.addEventListener('click', clickBlocker, { capture: true, once: true });
      
      // Also clear the flag after a short timeout as a fallback
      const timeout = setTimeout(() => {
        document.removeEventListener('click', clickBlocker, true);
        preventClickRef.current = false;
      }, 300);
      
      return () => {
        clearTimeout(timeout);
        document.removeEventListener('click', clickBlocker, true);
      };
    }
  }, [open]);

  // Custom handler for the onOpenChange event
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Set the prevention flag when sheet is being closed
      preventClickRef.current = true;
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
        }}
        onInteractOutside={(e) => {
          // Prevent any kind of outside interaction from propagating
          e.stopPropagation();
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
