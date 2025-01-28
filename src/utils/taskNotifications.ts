import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addMinutes } from "date-fns";

export const checkAndNotifyUpcomingTasks = async () => {
  try {
    console.log("Checking for upcoming tasks...");
    
    // Get tasks that are scheduled and have reminders enabled
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "scheduled")
      .eq("reminder_enabled", true);

    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }

    console.log("Found tasks:", tasks);

    const now = new Date();
    tasks?.forEach(task => {
      if (!task.date || !task.start_time) {
        console.log("Task missing date or start_time:", task);
        return;
      }

      const taskDateTime = parseISO(`${task.date}T${task.start_time}`);
      const notificationTime = addMinutes(now, 15);

      console.log("Task datetime:", taskDateTime);
      console.log("Current time:", now);
      console.log("Notification time:", notificationTime);

      if (taskDateTime > now && taskDateTime <= notificationTime) {
        console.log("Sending notification for task:", task);
        
        if ("Notification" in window && Notification.permission === "granted") {
          const timeString = format(taskDateTime, "h:mm a");
          
          navigator.serviceWorker.ready.then(registration => {
            console.log("Service worker ready, showing notification");
            registration.showNotification("Upcoming Task", {
              body: `${task.title} starts at ${timeString}`,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
              vibrate: [100, 50, 100],
              data: {
                taskId: task.id,
                url: window.location.origin + '/dashboard'
              },
              tag: `task-${task.id}`,
              renotify: true
            }).then(() => {
              console.log("Notification sent successfully");
            }).catch(error => {
              console.error("Error showing notification:", error);
            });
          }).catch(error => {
            console.error("Error with service worker:", error);
          });
        } else {
          console.log("Notifications not granted:", Notification.permission);
        }
      } else {
        console.log("Task not due for notification yet");
      }
    });
  } catch (error) {
    console.error("Error checking upcoming tasks:", error);
  }
};