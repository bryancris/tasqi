
import { useState, ReactNode, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAddTaskForm } from "@/hooks/use-add-task-form";
import { AddTaskHeader } from "./add-task/AddTaskHeader";
import { AddTaskForm } from "./add-task/AddTaskForm";

interface AddTaskDrawerProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialDate?: Date;
}

export function AddTaskDrawer({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialDate
}: AddTaskDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Determine if we should use controlled or uncontrolled state
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  // Use our custom hook to manage form state
  const { formState, formActions } = useAddTaskForm({ initialDate });

  // Log only when the open state changes, not on every render
  useEffect(() => {
    console.log("AddTaskDrawer open state changed:", open);
  }, [open]);

  const handleSuccess = () => {
    try {
      // First reset the form
      formActions.resetForm();
      
      // Then close the drawer
      onOpenChange(false);
    } catch (error) {
      console.error("Error in handleSuccess:", error);
    }
  };

  return (
    <>
      {children && (
        <div onClick={() => onOpenChange(true)}>
          {children}
        </div>
      )}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="left" 
          className="w-[400px] sm:max-w-[540px] p-0 pt-4 flex flex-col h-[100dvh]"
          onOpenAutoFocus={e => e.preventDefault()}
          onOpenChange={onOpenChange}
        >
          <div className="px-6 mb-2">
            <AddTaskHeader />
          </div>
          <div className="flex-1 overflow-hidden">
            <AddTaskForm 
              formState={formState}
              formActions={formActions}
              onSuccess={handleSuccess}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
