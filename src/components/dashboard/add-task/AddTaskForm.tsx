import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AddTaskContent } from "./AddTaskContent";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

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

  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const [directUserId, setDirectUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuthDirectly = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          console.log("Direct auth check in AddTaskForm successful:", data.user.id);
          setDirectUserId(data.user.id);
        }
      } catch (error) {
        console.error("Error in direct auth check in AddTaskForm:", error);
      }
    };
    
    checkAuthDirectly();
  }, []);

  const handleSubmit = async () => {
    console.log("handleSubmit called in AddTaskForm with title:", title);
    console.log("Current form state:", { 
      isScheduled, 
      isEvent, 
      isAllDay, 
      date, 
      startTime, 
      endTime,
      priority
    });
    
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (isEvent) {
      if (!date) {
        console.error("Events must have a date");
        toast.error("Events must have a date");
        return;
      }
    }

    const contextAuth = !!(session || user);
    const userId = session?.user?.id || user?.id || directUserId;
    
    console.log("Auth state in handleSubmit:", { 
      contextAuth,
      contextUserId: session?.user?.id || user?.id,
      directUserId,
      finalUserId: userId
    });
    
    if (!userId) {
      console.error("No active user ID found - user is not authenticated");
      toast.error("You must be signed in to create tasks");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting task creation process...");
      
      let status: 'scheduled' | 'unscheduled' | 'event';
      
      if (isEvent) {
        status = 'event';
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

      console.log("Step 1: Using authenticated user");
      console.log("User authenticated with ID:", userId);
      console.log("Task status determined as:", status);

      if ((isScheduled || (isEvent && !isAllDay)) && startTime && !endTime) {
        console.log("Missing end time when start time is set, using default end time");
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = (hours + 1) % 24;
        const newEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        setEndTime(newEndTime);
      }

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
        position: 0,
        assignees: [],
        shared: false,
        is_tracking: false,
        reschedule_count: 0
      };
      
      console.log("Step 2: Preparing task data:", taskData);

      console.log("Step 3: Fetching existing tasks for position");
      const { data: existingTasks, error: countError } = await supabase
        .from("tasks")
        .select("position")
        .order("position", { ascending: false })
        .limit(1);

      if (countError) {
        console.error("Error fetching task positions:", countError);
      } else {
        console.log("Existing tasks result:", existingTasks);
        if (existingTasks && existingTasks.length > 0) {
          taskData.position = existingTasks[0].position + 1;
          console.log("Set position to:", taskData.position);
        } else {
          console.log("No existing tasks found, keeping position at 0");
        }
      }

      console.log("Step 4: Creating task with final data:", taskData);
      const { data: taskResult, error: taskError } = await supabase
        .from("tasks")
        .insert([taskData])
        .select();

      if (taskError) {
        console.error("Error creating task:", taskError);
        console.error("Error details:", {
          message: taskError.message,
          code: taskError.code,
          details: taskError.details,
          hint: taskError.hint
        });
        
        if (taskError.message.includes("violates row-level security policy")) {
          console.error("RLS policy violation - check permissions");
          toast.error("Permission error: You don't have access to create tasks");
        } else {
          if (taskError.message.includes("invalid input value")) {
            console.error("Data validation error - check task data format");
            toast.error("Task creation failed: Invalid data format");
          } else {
            toast.error(`Error creating task: ${taskError.message}`);
          }
        }
        throw taskError;
      }
      
      console.log("Task created successfully:", taskResult);

      if (subtasks.length > 0 && taskResult && taskResult.length > 0) {
        const taskId = taskResult[0].id;
        
        const subtasksToInsert = subtasks.map((subtask, index) => ({
          task_id: taskId,
          title: subtask.title,
          status: subtask.status,
          position: index,
          notes: subtask.notes || null
        }));

        console.log("Step 5: Inserting subtasks:", subtasksToInsert);
        const { data: subtaskResult, error: subtasksError } = await supabase
          .from("subtasks")
          .insert(subtasksToInsert);

        if (subtasksError) {
          console.error("Error inserting subtasks:", subtasksError);
          throw subtasksError;
        }
        
        console.log("Subtasks inserted:", subtaskResult);
      } else {
        console.log("No subtasks to insert");
      }

      console.log("Step 6: Invalidating tasks query cache");
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      console.log("Step 7: Task creation complete, showing success message");
      toast.success('Task created successfully');
      
      console.log("Step 8: Calling onSuccess callback");
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
      console.log("Step 10: Setting loading state to false");
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
