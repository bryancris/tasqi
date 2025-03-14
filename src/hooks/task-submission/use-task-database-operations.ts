
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

// Define a more specific TaskData interface that aligns with what Supabase expects
interface TaskData {
  title: string;
  description: string;
  status: 'scheduled' | 'unscheduled' | 'event';
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  priority: 'low' | 'medium' | 'high';  // Updated to use literal types matching database
  reminder_enabled: boolean;
  reminder_time: number;
  user_id: string;
  owner_id: string;
  is_all_day: boolean;
  position: number;
  assignees: string[];
  shared: boolean;
  is_tracking: boolean;
  reschedule_count: number;
  [key: string]: any; // Keep this for flexibility with additional fields
}

export function useTaskDatabaseOperations() {
  // Create a new task in the database
  const createTask = async (taskData: TaskData) => {
    console.log("Creating task with final data:", taskData);
    const { data: taskResult, error: taskError } = await supabase
      .from("tasks")
      .insert(taskData)
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
    return taskResult;
  };

  // Create subtasks for a task
  const createSubtasks = async (taskId: number, subtasks: Subtask[]) => {
    if (subtasks.length === 0) {
      console.log("No subtasks to insert");
      return null;
    }
    
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
    return subtaskResult;
  };

  return { createTask, createSubtasks };
}
