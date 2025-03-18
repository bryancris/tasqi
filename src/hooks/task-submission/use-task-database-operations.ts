import { supabase } from "@/integrations/supabase/client";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";
import { TaskPriority } from "@/components/dashboard/TaskBoard";

interface TaskData {
  title: string;
  description: string;
  date: string | null;
  status: 'scheduled' | 'unscheduled' | 'event';
  start_time: string | null;
  end_time: string | null;
  priority: TaskPriority; 
  position: number;
  user_id: string;
  owner_id: string;
  shared: boolean;
  reminder_enabled: boolean;
  reminder_time: number;
  is_all_day: boolean;
  [key: string]: any;
}

export function useTaskDatabaseOperations() {
  const createTask = async (taskData: TaskData) => {
    console.log('⭐ Creating task with reminderTime =', taskData.reminder_time, 'Type:', typeof taskData.reminder_time);
    
    // Make sure reminder_time is never 0, convert to 5 minutes for backward compatibility
    if (taskData.reminder_enabled) {
      if (taskData.reminder_time === undefined || taskData.reminder_time === null || taskData.reminder_time === 0) {
        console.log('⭐ Setting reminder_time to 5 minutes because it was undefined/null/0');
        taskData.reminder_time = 5;
      }
      
      // Explicit number conversion to ensure database gets correct type
      taskData.reminder_time = Number(taskData.reminder_time);
      
      // Safety check - minimum is now 5 minutes
      if (taskData.reminder_time < 5) {
        console.log('⭐ Enforcing minimum 5 minute reminder time');
        taskData.reminder_time = 5;
      }
    }
    
    // Final verification before insertion
    const finalData = {
      ...taskData,
      // Ensure reminder_time is never 0
      reminder_time: Math.max(5, Number(taskData.reminder_time))
    };
    
    console.log('⭐ FINAL DATABASE INSERT with reminder_time =', finalData.reminder_time, 'Type:', typeof finalData.reminder_time);
    
    const { data, error } = await supabase
      .from("tasks")
      .insert(finalData)
      .select();

    if (error) {
      console.error('Error creating task in Supabase:', error);
      throw error;
    }

    // Verify the saved data
    if (data && data.length > 0) {
      console.log('⭐ VERIFY DATABASE RESULT:', {
        saved_reminder_time: data[0].reminder_time,
        saved_type: typeof data[0].reminder_time,
        saved_reminder_enabled: data[0].reminder_enabled
      });
    }

    console.log('Task created successfully:', data);
    return data;
  };

  const createSubtasks = async (taskId: number, subtasks: Subtask[]) => {
    if (!subtasks.length) return [];

    const subtasksToInsert = subtasks.map((subtask, index) => ({
      task_id: taskId,
      title: subtask.title,
      status: subtask.status || 'pending',
      position: index * 100,
      notes: subtask.notes || null,
    }));

    const { data, error } = await supabase
      .from("subtasks")
      .insert(subtasksToInsert)
      .select();

    if (error) {
      console.error('Error creating subtasks in Supabase:', error);
      throw error;
    }

    return data;
  };

  return { createTask, createSubtasks };
}
