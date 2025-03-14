
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TaskPriority } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";
import { useTaskValidation } from "./use-task-validation";
import { useTaskDataPreparation } from "./use-task-data-preparation";
import { useTaskDatabaseOperations } from "./use-task-database-operations";

interface TaskFormState {
  title: string;
  description: string;
  isScheduled: boolean;
  isEvent: boolean;
  isAllDay: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
  reminderEnabled: boolean;
  reminderTime: number;
  subtasks: Subtask[];
}

interface UseTaskSubmissionProps {
  onSuccess: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function useTaskSubmissionCore({ onSuccess, setIsLoading }: UseTaskSubmissionProps) {
  const queryClient = useQueryClient();
  const { validateTaskInput } = useTaskValidation();
  const { prepareTaskData } = useTaskDataPreparation();
  const { createTask, createSubtasks } = useTaskDatabaseOperations();

  const handleSubmit = async (formState: TaskFormState, userId: string) => {
    console.log("handleSubmit called with title:", formState.title);
    console.log("Current form state:", { 
      isScheduled: formState.isScheduled, 
      isEvent: formState.isEvent, 
      isAllDay: formState.isAllDay, 
      date: formState.date, 
      startTime: formState.startTime, 
      endTime: formState.endTime,
      priority: formState.priority,
      reminderEnabled: formState.reminderEnabled,
      reminderTime: formState.reminderTime 
    });
    
    // Enhanced debug logging for zero values
    console.log(`⚡ Reminder time value before validation: ${formState.reminderTime} (type: ${typeof formState.reminderTime}), stringified: '${JSON.stringify(formState.reminderTime)}'`);
    
    if (formState.reminderTime === 0) {
      console.log("⚡ Zero reminderTime detected in handleSubmit");
    }

    // CRITICAL FIX: Explicitly check if reminderTime is exactly 0 to preserve "At start time"
    // This explicit case is needed because JavaScript treats 0 as falsy in many contexts
    let reminderTimeValue: number;
    if (formState.reminderTime === 0) { 
      reminderTimeValue = 0; // Preserve explicit zero (At start time)
      console.log("⚡ Explicitly keeping reminderTime as EXACTLY 0 (At start time)");
    } else if (typeof formState.reminderTime === 'number') {
      reminderTimeValue = formState.reminderTime; // Use existing number value
      console.log(`⚡ Using existing number value: ${reminderTimeValue}`);
    } else if (typeof formState.reminderTime === 'string' && formState.reminderTime === '0') {
      reminderTimeValue = 0; // Convert string "0" to number 0
      console.log("⚡ Converting string '0' to number 0");
    } else if (formState.reminderTime) {
      reminderTimeValue = Number(formState.reminderTime); // Convert non-zero value
      console.log(`⚡ Converting non-zero value to: ${reminderTimeValue}`);
    } else {
      reminderTimeValue = 0; // Default to "At start time" (0) instead of 15
      console.log("⚡ No value provided, defaulting to 0 (At start time)");
    }
    
    console.log(`⚡ Processed reminder time value: ${reminderTimeValue} (type: ${typeof reminderTimeValue})`);
    
    // Create a clean copy with proper number handling
    const validatedFormState = {
      ...formState,
      reminderTime: reminderTimeValue
    };
    
    // Validate the input data
    if (!validateTaskInput({
      title: formState.title,
      isEvent: formState.isEvent,
      date: formState.date,
      userId
    })) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting task creation process...");
      
      // Prepare the task data
      const { taskData } = await prepareTaskData(validatedFormState, userId);
      
      // Enhanced debug for the taskData to confirm reminder_time is correctly set
      console.log("Task data prepared with reminder_time:", taskData.reminder_time, "type:", typeof taskData.reminder_time);
      
      if (taskData.reminder_time === 0) {
        console.log("⚡ Zero reminder_time confirmed in final taskData");
      }
      
      // Create the task
      const taskResult = await createTask(taskData);
      
      // Add subtasks if there are any and if task was created successfully
      if (formState.subtasks.length > 0 && taskResult && taskResult.length > 0) {
        const taskId = taskResult[0].id;
        await createSubtasks(taskId, formState.subtasks);
      }

      // Update the UI
      console.log("Invalidating tasks query cache");
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      console.log("Task creation complete, showing success message");
      toast.success('Task created successfully');
      
      console.log("Calling onSuccess callback");
      if (typeof onSuccess === 'function') {
        onSuccess();
        console.log("onSuccess callback completed");
      } else {
        console.error("onSuccess is not a function:", onSuccess);
      }
      
    } catch (error: any) {
      console.error('Error creating task - detailed error:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      const errorMessage = error.message || 'Unknown error';
      console.log("Error creating task:", errorMessage);
      toast.error('Failed to create task: ' + errorMessage);
    } finally {
      console.log("Setting loading state to false");
      setIsLoading(false);
    }
  };

  return { handleSubmit };
}
