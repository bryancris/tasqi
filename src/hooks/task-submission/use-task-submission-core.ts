
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TaskPriority } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";
import { useTaskValidation } from "./use-task-validation";
import { useTaskDataPreparation } from "./use-task-data-preparation";
import { useTaskDatabaseOperations } from "./use-task-database-operations";
import { normalizeReminderTime } from "@/utils/notifications/debug-utils";

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
      reminderTime: formState.reminderTime,
      reminderTimeType: typeof formState.reminderTime,
      isExactlyZero: formState.reminderTime === 0 ? "YES - AT START TIME" : "NO"
    });
    
    // CRITICAL FIX: Always normalize the reminderTime to ensure consistent handling
    let normalizedFormState = { 
      ...formState,
      reminderTime: normalizeReminderTime(formState.reminderTime)
    };
    
    console.log(`🚨 SUBMISSION: Original reminderTime=${formState.reminderTime} → normalized to ${normalizedFormState.reminderTime}`);
    console.log(`🚨 Is "At start time"? ${normalizedFormState.reminderTime === 0 ? "YES" : "NO"}`);
    
    // Validate the input data
    if (!validateTaskInput({
      title: normalizedFormState.title,
      isEvent: normalizedFormState.isEvent,
      date: normalizedFormState.date,
      userId
    })) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting task creation process...");
      
      // Prepare the task data
      const { taskData } = await prepareTaskData(normalizedFormState, userId);
      
      // Enhanced debug for the taskData to confirm reminder_time is correctly set
      console.log("Task data prepared with reminder_time:", taskData.reminder_time, "type:", typeof taskData.reminder_time);
      console.log(`Is "At start time"? ${taskData.reminder_time === 0 ? "YES" : "NO"}`);
      
      // Create the task
      const taskResult = await createTask(taskData);
      
      // Add subtasks if there are any and if task was created successfully
      if (normalizedFormState.subtasks.length > 0 && taskResult && taskResult.length > 0) {
        const taskId = taskResult[0].id;
        await createSubtasks(taskId, normalizedFormState.subtasks);
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
