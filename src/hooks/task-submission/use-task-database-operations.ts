
import { supabase } from "@/integrations/supabase/client";
import { Subtask } from "@/components/dashboard/subtasks/SubtaskList";

interface TaskData {
  title: string;
  description: string;
  date: string | null;
  status: 'scheduled' | 'unscheduled' | 'event';
  start_time: string | null;
  end_time: string | null;
  priority: string;
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
    console.log('⚡ Creating task with reminderTime =', taskData.reminder_time, 'Type:', typeof taskData.reminder_time);
    
    // Ensure reminder_time is properly set to 0 when intended
    if (taskData.reminder_enabled && (taskData.reminder_time === undefined || taskData.reminder_time === null)) {
      console.log('⚠️ Setting reminder_time to 0 (default) because it was undefined/null');
      taskData.reminder_time = 0;
    }
    
    const { data, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select();

    if (error) {
      console.error('Error creating task in Supabase:', error);
      throw error;
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
      user_id: subtask.user_id || null,
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
