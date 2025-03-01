
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AddTaskContent } from "./AddTaskContent";

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

  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    console.log("handleSubmit called in AddTaskForm with title:", title);
    
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsLoading(true);
    try {
      let status: 'scheduled' | 'unscheduled' | 'event';
      
      if (isEvent) {
        status = 'event';
        // Events must have a date
        if (!date) {
          toast.error("Events must have a date");
          setIsLoading(false);
          return;
        }
      } else if (isScheduled) {
        status = 'scheduled';
      } else {
        status = 'unscheduled';
      }

      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) throw new Error("User not authenticated");

      // Prepare the task data
      const taskData = {
        title,
        description,
        status,
        date: (isScheduled || isEvent) && date ? date : null,
        start_time: (isScheduled || (isEvent && !isAllDay)) && startTime ? startTime : null,
        end_time: (isScheduled || (isEvent && !isAllDay)) && endTime ? endTime : null,
        priority: isEvent ? "medium" : priority,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderTime,
        user_id: userId,
        owner_id: userId,
        is_all_day: isEvent ? isAllDay : false,
        position: 0 // This will be adjusted by the backend
      };
      
      console.log("Preparing to create task with data:", taskData);

      // Get existing tasks count to properly set position
      const { data: existingTasks, error: countError } = await supabase
        .from("tasks")
        .select("position")
        .order("position", { ascending: false })
        .limit(1);

      if (!countError && existingTasks && existingTasks.length > 0) {
        taskData.position = existingTasks[0].position + 1;
      }

      // Create the task
      console.log("Creating task with final data:", taskData);
      const { data: taskResult, error: taskError } = await supabase
        .from("tasks")
        .insert([taskData])
        .select();

      if (taskError) throw taskError;
      console.log("Task created:", taskResult);

      // If there are subtasks, insert them
      if (subtasks.length > 0 && taskResult && taskResult.length > 0) {
        const taskId = taskResult[0].id;
        
        const subtasksToInsert = subtasks.map((subtask, index) => ({
          task_id: taskId,
          title: subtask.title,
          status: subtask.status,
          position: index,
          notes: subtask.notes || null
        }));

        console.log("Inserting subtasks:", subtasksToInsert);
        const { error: subtasksError } = await supabase
          .from("subtasks")
          .insert(subtasksToInsert);

        if (subtasksError) throw subtasksError;
      }

      // Invalidate and refetch tasks
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      toast.success('Task created successfully');
      
      // Reset the form
      resetForm();
      
      // Call onSuccess callback
      console.log("Calling onSuccess callback");
      onSuccess();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
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
      onSubmit={handleSubmit}
    />
  );
}
