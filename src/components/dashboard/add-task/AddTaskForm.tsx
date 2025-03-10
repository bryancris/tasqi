
import { AddTaskContent } from "./AddTaskContent";
import { useAuthCheck } from "@/hooks/use-auth-check";
import { useTaskSubmission } from "@/hooks/use-task-submission";

interface AddTaskFormProps {
  formState: ReturnType<typeof import("@/hooks/use-add-task-form").useAddTaskForm>["formState"];
  formActions: ReturnType<typeof import("@/hooks/use-add-task-form").useAddTaskForm>["formActions"];
  onSuccess: () => void;
}

export function AddTaskForm({ formState, formActions, onSuccess }: AddTaskFormProps) {
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
    isLoading
  } = formState;

  const {
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
    setIsLoading,
    resetForm
  } = formActions;

  // Use our custom hooks
  const { userId, isAuthenticated } = useAuthCheck();
  const { handleSubmit } = useTaskSubmission({ 
    onSuccess, 
    setIsLoading 
  });

  const onSubmit = async () => {
    if (!isAuthenticated) return;
    
    await handleSubmit(
      {
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
        subtasks
      },
      userId as string
    );
  };

  console.log("AddTaskForm rendered, passing handleSubmit to AddTaskContent");

  return (
    <AddTaskContent
      title={title}
      description={description}
      isScheduled={isScheduled}
      isEvent={isEvent}
      isAllDay={isAllDay}
      date={date}
      startTime={startTime}
      endTime={endTime}
      priority={priority}
      reminderEnabled={reminderEnabled}
      reminderTime={reminderTime}
      subtasks={subtasks}
      isLoading={isLoading}
      onTitleChange={setTitle}
      onDescriptionChange={setDescription}
      onIsScheduledChange={setIsScheduled}
      onIsEventChange={setIsEvent}
      onIsAllDayChange={setIsAllDay}
      onDateChange={setDate}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
      onPriorityChange={setPriority}
      onReminderEnabledChange={setReminderEnabled}
      onReminderTimeChange={setReminderTime}
      onSubtasksChange={setSubtasks}
      onSubmit={onSubmit}
    />
  );
}
