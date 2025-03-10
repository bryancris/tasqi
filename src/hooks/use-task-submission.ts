
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { TaskPriority } from "@/components/dashboard/TaskBoard";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

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

export function useTaskSubmission({ onSuccess, setIsLoading }: UseTaskSubmissionProps) {
  const queryClient = useQueryClient();

  const handleSubmit = async (formState: TaskFormState, userId: string) => {
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
      subtasks
    } = formState;

    console.log("handleSubmit called with title:", title);
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

    if (isEvent && !date) {
      console.error("Events must have a date");
      toast.error("Events must have a date");
      return;
    }

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

      console.log("Task status determined as:", status);

      // Calculate end time if only start time is provided
      let finalEndTime = endTime;
      if ((isScheduled || (isEvent && !isAllDay)) && startTime && !endTime) {
        console.log("Missing end time when start time is set, using default end time");
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = (hours + 1) % 24;
        finalEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }

      const taskData = {
        title,
        description,
        status,
        date: (isScheduled || isEvent) && date ? date : null,
        start_time: (isScheduled || (isEvent && !isAllDay)) && startTime ? startTime : null,
        end_time: (isScheduled || (isEvent && !isAllDay)) && finalEndTime ? finalEndTime : null,
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
      
      console.log("Preparing task data:", taskData);

      // Get position for the new task
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

      // Create the task
      console.log("Creating task with final data:", taskData);
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

      // Add subtasks if there are any
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
