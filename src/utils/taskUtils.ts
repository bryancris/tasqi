
import { supabase } from "@/integrations/supabase/client";
import { TaskPriority } from "@/components/dashboard/TaskBoard";

interface CreateTaskParams {
  title: string;
  description: string;
  isScheduled: boolean;
  isEvent: boolean;
  isAllDay: boolean;
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
  isEvent,
  isAllDay,
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
  if (startTime && (!endTime || endTime.trim() === '')) {
    // Parse the hours and minutes from startTime
    const [hours, minutes] = startTime.split(':').map(Number);
    // Add one hour
    const newHours = (hours + 1) % 24;
    // Format back to HH:MM:SS
    calculatedEndTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    console.log(`Calculated end time: ${calculatedEndTime} from start time: ${startTime}`);
  }

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;

  // Determine the task status
  let status;
  if (isEvent) {
    status = "event";
  } else if (isScheduled) {
    status = "scheduled";
  } else {
    status = "unscheduled";
  }

  // Determine time fields based on task type and all-day setting
  const taskStartTime = isAllDay ? null : startTime;
  const taskEndTime = isAllDay ? null : calculatedEndTime;

  const { data, error } = await supabase.from("tasks").insert({
    title,
    description,
    date,
    status,
    start_time: taskStartTime,
    end_time: taskEndTime,
    priority,
    position: nextPosition,
    reminder_enabled: reminderEnabled,
    reminder_time: reminderTime,
    user_id: user.user.id,
    owner_id: user.user.id,
    is_all_day: isAllDay,
    shared: false
  });

  if (error) throw error;
  return data;
};

export const updateTask = async (taskId: number, updates: Partial<CreateTaskParams>) => {
  // Apply the same end time calculation logic for updates
  let updatedEndTime = updates.endTime;
  if (updates.startTime && (!updates.endTime || updates.endTime.trim() === '')) {
    // Parse the hours and minutes from startTime
    const [hours, minutes] = updates.startTime.split(':').map(Number);
    // Add one hour
    const newHours = (hours + 1) % 24;
    // Format back to HH:MM:SS
    updatedEndTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    console.log(`Calculated updated end time: ${updatedEndTime} from start time: ${updates.startTime}`);
  }

  // Determine the task status
  let status;
  if (updates.isEvent) {
    status = "event";
  } else if (updates.isScheduled) {
    status = "scheduled";
  } else {
    status = "unscheduled";
  }

  // Determine time fields based on task type and all-day setting
  const taskStartTime = updates.isAllDay ? null : updates.startTime;
  const taskEndTime = updates.isAllDay ? null : updatedEndTime;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...updates,
      date: updates.date || null,
      status,
      start_time: taskStartTime,
      end_time: taskEndTime,
      is_all_day: updates.isAllDay || false
    })
    .eq('id', taskId);

  if (error) throw error;
  return data;
};
