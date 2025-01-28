import { supabase } from "@/integrations/supabase/client";
import { TaskPriority } from "@/components/dashboard/TaskBoard";

interface CreateTaskParams {
  title: string;
  description: string;
  isScheduled: boolean;
  date: string;
  startTime: string;
  endTime: string;
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
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks[0] ? existingTasks[0].position + 1 : 0;

  const { data, error } = await supabase.from("tasks").insert([
    {
      title,
      description,
      date: isScheduled ? date : null,
      status: isScheduled ? "scheduled" : "unscheduled",
      start_time: isScheduled && startTime ? startTime : null,
      end_time: isScheduled && endTime ? endTime : null,
      priority,
      position: nextPosition,
      reminder_enabled: reminderEnabled,
    },
  ]);

  if (error) throw error;
  return data;
};