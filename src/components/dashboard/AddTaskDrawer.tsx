
import { useState, ReactNode } from "react";
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

  const handleSuccess = () => {
    console.log("handleSuccess called in AddTaskDrawer");
    try {
      // First reset the form
      formActions.resetForm();
      console.log("Form reset successfully");
      
      // Then close the drawer
      onOpenChange(false);
      console.log("Drawer closed successfully");
    } catch (error) {
      console.error("Error in handleSuccess:", error);
    }
  };

  console.log("AddTaskDrawer rendered, open state:", open);

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
          className="w-[400px] sm:max-w-[540px]"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <AddTaskHeader />
          <AddTaskForm 
            formState={formState}
            formActions={formActions}
            onSuccess={handleSuccess}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
