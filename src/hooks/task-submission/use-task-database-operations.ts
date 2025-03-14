
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

interface TaskData {
  [key: string]: any; // Allow for dynamic keys in the task data
}

export function useTaskDatabaseOperations() {
  // Create a new task in the database
  const createTask = async (taskData: TaskData) => {
    console.log("Creating task with final data:", taskData);
    const { data: taskResult, error: taskError } = await supabase
      .from("tasks")
      .insert(taskData) // Changed from [taskData] to taskData
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
