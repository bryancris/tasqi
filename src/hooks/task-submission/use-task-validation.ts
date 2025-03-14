
import { toast } from "sonner";
import { TaskPriority } from "@/components/dashboard/TaskBoard";

interface ValidationState {
  title: string;
  isEvent: boolean;
  date: string;
  userId: string;
}

export function useTaskValidation() {
  const validateTaskInput = (data: ValidationState): boolean => {
    console.log("Validating task input:", { title: data.title, isEvent: data.isEvent, date: data.date });
    
    if (!data.title.trim()) {
      toast.error("Please enter a task title");
      return false;
    }

    if (data.isEvent && !data.date) {
      console.error("Events must have a date");
      toast.error("Events must have a date");
      return false;
    }

    if (!data.userId) {
      console.error("No active user ID found - user is not authenticated");
      toast.error("You must be signed in to create tasks");
      return false;
    }

    return true;
  };

  return { validateTaskInput };
}
