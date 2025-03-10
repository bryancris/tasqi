
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { SharingDetailsHeader } from "./sharing-info/SharingDetailsHeader";
import { SharingSheetContent } from "./components/SharingSheetContent";
import { useSharingSheetEffects } from "./hooks/useSharingSheetEffects";
import { useSharingSheetPointerHandler } from "./components/SharingSheetPointerHandler";
import { useForceCloseSheet } from "./hooks/useForceCloseSheet";

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
  // Use our custom hooks to manage sheet state and effects
  const { uniqueIdRef, isIOSPwaApp, handleOpenChange } = useSharingSheetEffects({ 
    open, 
    onOpenChange 
  });
  
  // Handle force closing as a fallback mechanism
  useForceCloseSheet(open, onOpenChange);
  
  // Handle pointer events outside the sheet
  const { handlePointerDownOutside } = useSharingSheetPointerHandler({
    isIOSPwaApp
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent 
        side="bottom" 
        className={`max-h-96 rounded-t-xl z-[60] ${isIOSPwaApp ? 'ios-pwa-sharing-sheet' : ''}`}
        data-sharing-sheet-id={uniqueIdRef.current}
        onOpenChange={handleOpenChange}
        onPointerDownOutside={handlePointerDownOutside}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <SharingDetailsHeader task={task} assignmentInfo={assignmentInfo} />
          </SheetTitle>
        </SheetHeader>
        
        <SharingSheetContent task={task} assignmentInfo={assignmentInfo} />
      </SheetContent>
    </Sheet>
  );
}
