
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
    console.log("🔍 handleSubmit called with title:", formState.title);
    console.log("🔍 Reminder data:", { 
      reminderEnabled: formState.reminderEnabled, 
      reminderTime: formState.reminderTime,
      reminderTimeType: typeof formState.reminderTime,
      isExactlyZero: formState.reminderTime === 0 ? "YES - AT START TIME" : "NO - has minutes before"
    });
    
    // Create a clean copy of form state to prevent modification of original
    let taskFormState = { ...formState };
    
    // CRITICAL FIX: For "At start time" (0) - we must preserve exact 0
    if (formState.reminderTime === 0) {
      console.log('🚨 SUBMISSION: Found exact 0, preserving "At start time" value');
      // Explicitly ensure it stays as the number 0
      taskFormState.reminderTime = 0;
    } 
    // Only normalize non-zero values to prevent any chance of changing 0 to another value
    else if (formState.reminderTime !== 0) {
      taskFormState.reminderTime = normalizeReminderTime(formState.reminderTime);
      console.log(`🚨 SUBMISSION: Normalized non-zero reminderTime from ${formState.reminderTime} to ${taskFormState.reminderTime}`);
    }
    
    console.log(`🚨 SUBMISSION: Final reminderTime=${taskFormState.reminderTime} (${typeof taskFormState.reminderTime})`);
    console.log(`🚨 Is "At start time"? ${taskFormState.reminderTime === 0 ? "YES" : "NO"}`);
    
    // Validate the input data
    if (!validateTaskInput({
      title: taskFormState.title,
      isEvent: taskFormState.isEvent,
      date: taskFormState.date,
      userId
    })) {
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting task creation process...");
      
      // Prepare the task data
      const { taskData } = await prepareTaskData(taskFormState, userId);
      
      // Enhanced debug for the taskData to confirm reminder_time is correctly set
      console.log("Task data prepared with reminder_time:", taskData.reminder_time, "type:", typeof taskData.reminder_time);
      console.log(`Is "At start time"? ${taskData.reminder_time === 0 ? "YES" : "NO"}`);
      
      // Create the task
      const taskResult = await createTask(taskData);
      
      // Add subtasks if there are any and if task was created successfully
      if (taskFormState.subtasks.length > 0 && taskResult && taskResult.length > 0) {
        const taskId = taskResult[0].id;
        await createSubtasks(taskId, taskFormState.subtasks);
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
