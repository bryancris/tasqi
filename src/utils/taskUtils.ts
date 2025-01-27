import { supabase } from "@/integrations/supabase/client";
import { TaskPriority } from "@/components/dashboard/TaskBoard";

interface CreateTaskData {
  title: string;
  description: string;
  isScheduled: boolean;
  date: string;
  startTime: string;
  endTime: string;
  priority: TaskPriority;
}

export const createTask = async ({
  title,
  description,
  isScheduled,
  date,
  startTime,
  endTime,
  priority,
}: CreateTaskData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("No user logged in");
  }

  // Get the highest position number for the current user
  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks.length > 0 
    ? existingTasks[0].position + 1 
    : 1;

  const { error } = await supabase.from("tasks").insert({
    title,
    description,
    date: isScheduled ? date : null,
    status: isScheduled ? "scheduled" : "unscheduled",
    start_time: isScheduled ? startTime : null,
    end_time: isScheduled ? endTime : null,
    priority,
    user_id: user.id,
    position: nextPosition,
  });

  if (error) throw error;
};