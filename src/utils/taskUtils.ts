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
}: CreateTaskParams) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("User not authenticated");

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;

  // Use the date directly without any transformation
  const { data, error } = await supabase.from("tasks").insert({
    title,
    description,
    date,
    status: isScheduled ? "scheduled" : "unscheduled",
    start_time: startTime || null,
    end_time: endTime || null,
    priority,
    position: nextPosition,
    reminder_enabled: reminderEnabled,
    user_id: user.user.id
  });

  if (error) throw error;
  return data;
};

export const updateTask = async (taskId: number, updates: Partial<CreateTaskParams>) => {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...updates,
      date: updates.date || null,
      status: updates.isScheduled ? "scheduled" : "unscheduled"
    })
    .eq('id', taskId);

  if (error) throw error;
  return data;
};