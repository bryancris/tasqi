

import { supabase } from "@/integrations/supabase/client";
import { TaskPriority } from "@/components/dashboard/TaskBoard";

interface CreateTaskParams {
  title: string;
  description: string;
  isScheduled: boolean;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  priority: TaskPriority;
  reminderEnabled: boolean;
  reminderTime: number;
}

export const createTask = async ({
  title,
  description,
  isScheduled,
  date,
  startTime,
  endTime,
  priority,
  reminderEnabled,
  reminderTime,
}: CreateTaskParams) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("User not authenticated");

  // Calculate endTime if startTime is provided but endTime is not
  let calculatedEndTime = endTime;
  if (startTime && !endTime) {
    // Parse the hours and minutes from startTime
    const [hours, minutes] = startTime.split(':').map(Number);
    // Add one hour
    let newHours = hours + 1;
    // Handle overflow (if hours becomes 24 or greater)
    if (newHours >= 24) {
      newHours = newHours - 24;
    }
    // Format back to HH:MM:SS
    calculatedEndTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;

  const { data, error } = await supabase.from("tasks").insert({
    title,
    description,
    date,
    status: isScheduled ? "scheduled" : "unscheduled",
    start_time: startTime || null,
    end_time: calculatedEndTime || null,
    priority,
    position: nextPosition,
    reminder_enabled: reminderEnabled,
    reminder_time: reminderTime,
    user_id: user.user.id,
    owner_id: user.user.id,
    shared: false
  });

  if (error) throw error;
  return data;
};

export const updateTask = async (taskId: number, updates: Partial<CreateTaskParams>) => {
  // Apply the same end time calculation logic for updates
  let updatedEndTime = updates.endTime;
  if (updates.startTime && !updates.endTime) {
    // Parse the hours and minutes from startTime
    const [hours, minutes] = updates.startTime.split(':').map(Number);
    // Add one hour
    let newHours = hours + 1;
    // Handle overflow (if hours becomes 24 or greater)
    if (newHours >= 24) {
      newHours = newHours - 24;
    }
    // Format back to HH:MM:SS
    updatedEndTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...updates,
      date: updates.date || null,
      status: updates.isScheduled ? "scheduled" : "unscheduled",
      end_time: updatedEndTime || null
    })
    .eq('id', taskId);

  if (error) throw error;
  return data;
};

