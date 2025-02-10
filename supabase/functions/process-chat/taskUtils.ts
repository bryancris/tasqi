
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TaskDetails } from './types.ts';

export async function getNextPosition(supabase: any, userId: string): Promise<number> {
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1);

  return existingTasks && existingTasks.length > 0 
    ? existingTasks[0].position + 1 
    : 1;
}

export async function createTask(supabase: any, userId: string, taskDetails: TaskDetails): Promise<void> {
  console.log('Creating task with details:', taskDetails);
  
  const nextPosition = await getNextPosition(supabase, userId);
  
  const { error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: taskDetails.title,
      description: taskDetails.description || null,
      date: taskDetails.isScheduled ? taskDetails.date : null,
      status: taskDetails.isScheduled ? "scheduled" : "unscheduled",
      start_time: taskDetails.startTime,
      end_time: taskDetails.endTime,
      priority: taskDetails.priority || "low", // Use the priority from taskDetails
      user_id: userId,
      owner_id: userId,
      position: nextPosition,
    });

  if (taskError) {
    console.error('Error creating task:', taskError);
    throw taskError;
  }
}
