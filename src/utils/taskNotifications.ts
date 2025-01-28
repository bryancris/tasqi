import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";
import { format, parseISO, addMinutes } from "date-fns";

export const checkAndNotifyUpcomingTasks = async () => {
  try {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "scheduled")
      .eq("reminder_enabled", true);

    if (error) throw error;

    tasks?.forEach((task: Task) => {
      if (!task.date || !task.start_time) return;

      const taskDateTime = parseISO(`${task.date}T${task.start_time}`);
      const now = new Date();
      const notificationTime = addMinutes(now, 15);

      if (taskDateTime > now && taskDateTime <= notificationTime) {
        const timeString = format(taskDateTime, "h:mm a");
        
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Upcoming Task", {
            body: `${task.title} starts at ${timeString}`,
            icon: "/pwa-192x192.png",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error checking upcoming tasks:", error);
  }
};