
import { Task } from "../TaskBoard";
import { useTaskStateInitialization, useTaskDeletion, useTaskSubmission, useEditTaskUIState } from "@/hooks/edit-task";

export function useEditTaskState(task: Task, onClose: () => void) {
  // Initialize task state values
  const {
    title,
    description,
    isScheduled,
    isEvent,
    isAllDay,
    date,
    startTime,
    endTime,
    priority,
    reminderEnabled,
    reminderTime,
    subtasks,
    setTitle,
    setDescription,
    setIsScheduled,
    setIsEvent,
    setIsAllDay,
    setDate,
    setStartTime,
    setEndTime,
    setPriority,
    setReminderEnabled,
    setReminderTime,
    setSubtasks
  } = useTaskStateInitialization(task);

  // UI state for dialogs, etc.
  const {
    showShareDialog,
    setShowShareDialog,
    handleDateChange: baseHandleDateChange
  } = useEditTaskUIState();

  // Task deletion functionality
  const { isDeletingTask, handleDelete } = useTaskDeletion(task.id, onClose);

  // Task form submission 
  const taskFormState = {
    title,
    description,
    isScheduled,
    isEvent,
    isAllDay,
    date,
    startTime,
    endTime,
    priority,
    reminderEnabled,
    reminderTime
  };
  
  const { isLoading, handleSubmit } = useTaskSubmission(task.id, taskFormState, subtasks, onClose);

  // Wrapper for date change to update local state
  const handleDateChange = (newDate: string) => {
    const processedDate = baseHandleDateChange(newDate);
    setDate(processedDate);
    return processedDate;
  };

  return {
    // Form state
    title,
    description,
    isScheduled,
    isEvent,
    isAllDay,
    date,
    startTime,
    endTime,
    priority,
    reminderEnabled,
    reminderTime,
    subtasks,
    
    // Loading states
    isLoading,
    isDeletingTask,
    
    // UI state
    showShareDialog,
    
    // State setters
    setTitle,
    setDescription,
    setIsScheduled,
    setIsEvent,
    setIsAllDay,
    setDate,
    setStartTime,
    setEndTime,
    setPriority,
    setReminderEnabled,
    setReminderTime,
    setSubtasks,
    setShowShareDialog,
    
    // Handler functions
    handleDateChange,
    handleSubmit,
    handleDelete
  };
}
