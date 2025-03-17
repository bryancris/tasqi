
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
    console.log('⭐ Is "At start time"?', taskData.reminder_time === 0 ? 'YES' : 'NO');
    
    // CRITICAL FIX: Special handling for "At start time" (0) to ensure it's preserved
    if (taskData.reminder_enabled) {
      if (taskData.reminder_time === undefined || taskData.reminder_time === null) {
        console.log('⭐ Setting reminder_time to 0 (At start time) because it was undefined/null');
        taskData.reminder_time = 0;
      }
      
      // CRITICAL FIX: Explicit number conversion to ensure database gets correct type
      taskData.reminder_time = Number(taskData.reminder_time);
      
      // Explicit check to ensure "At start time" (0) is preserved
      if (taskData.reminder_time === 0) {
        console.log('⭐ Confirmed "At start time" value is preserved before database write');
      }
    }
    
    // Final verification before insertion
    const finalData = {
      ...taskData,
      // CRITICAL FIX: Force reminder_time to be exactly 0 for "At start time" 
      reminder_time: taskData.reminder_time === 0 ? 0 : Number(taskData.reminder_time)
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
        saved_reminder_enabled: data[0].reminder_enabled,
        is_exactly_zero: data[0].reminder_time === 0 ? 'YES - AT START TIME' : 'NO - has minutes before'
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
