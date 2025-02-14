
import { TaskDetails } from "./types.ts";
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function createTask(supabase: SupabaseClient, userId: string, taskDetails: TaskDetails) {
  try {
    // First create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: taskDetails.title,
        description: taskDetails.description,
        date: taskDetails.date,
        start_time: taskDetails.startTime,
        end_time: taskDetails.endTime,
        status: taskDetails.isScheduled ? 'scheduled' : 'unscheduled',
        priority: taskDetails.priority || 'low',
        user_id: userId,
        owner_id: userId,
        position: 0, // Will be updated by the client
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // If there are subtasks, create them
    if (taskDetails.subtasks && taskDetails.subtasks.length > 0 && task) {
      const { error: subtasksError } = await supabase
        .from('subtasks')
        .insert(
          taskDetails.subtasks.map(subtask => ({
            task_id: task.id,
            title: subtask.title,
            status: subtask.status,
            position: subtask.position
          }))
        );

      if (subtasksError) throw subtasksError;
    }

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}
