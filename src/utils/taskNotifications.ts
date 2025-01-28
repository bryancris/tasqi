import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addMinutes } from "date-fns";

export const checkAndNotifyUpcomingTasks = async () => {
  try {
    // Get tasks that are scheduled and have reminders enabled
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "scheduled")
      .eq("reminder_enabled", true);

    if (error) throw error;

    const now = new Date();
    tasks?.forEach(task => {
      if (!task.date || !task.start_time) return;

      const taskDateTime = parseISO(`${task.date}T${task.start_time}`);
      const notificationTime = addMinutes(now, 15);

      if (taskDateTime > now && taskDateTime <= notificationTime) {
        const timeString = format(taskDateTime, "h:mm a");
        
        if ("Notification" in window && Notification.permission === "granted") {
          const registration = navigator.serviceWorker?.ready;
          registration.then(reg => {
            reg.showNotification("Upcoming Task", {
              body: `${task.title} starts at ${timeString}`,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
              vibrationPattern: [100, 50, 100], // Changed from vibrate to vibrationPattern
              data: {
                taskId: task.id,
                url: window.location.origin + '/dashboard'
              },
              tag: `task-${task.id}`,
              renotify: true
            });
          });
        }
      }
    });
  } catch (error) {
    console.error("Error checking upcoming tasks:", error);
  }
};