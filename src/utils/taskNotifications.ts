
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes, isSameMinute } from "date-fns";

// Keep track of notifications we've already sent
const notifiedTasks = new Set<number>();

export const checkAndNotifyUpcomingTasks = async () => {
  try {
    console.log("================== TASK NOTIFICATION CHECK ==================");
    console.log("Checking for upcoming tasks...");
    
    // First check if notifications are supported and permitted
    if (!("Notification" in window)) {
      console.error("This browser does not support notifications");
      return;
    }

    console.log("Current notification permission:", Notification.permission);
    
    // If permission is not granted, request it
    if (Notification.permission !== "granted") {
      console.log("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("Permission response:", permission);
      if (permission !== "granted") {
        console.log("Notification permission not granted");
        return;
      }
    }

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

    console.log(`Found ${tasks?.length || 0} tasks with reminders enabled`);

    const now = new Date();
    console.log("Current time:", now.toLocaleString());

    tasks?.forEach(task => {
      console.log("\n🔔 Checking task:", task.title);
      
      if (!task.date || !task.start_time) {
        console.log("❌ Task missing date or start_time:", task);
        return;
      }

      // Skip if we've already notified about this task
      if (notifiedTasks.has(task.id)) {
        console.log("⏭️ Already notified about task:", task.id);
        return;
      }

      const taskDateTime = parseISO(`${task.date}T${task.start_time}`);
      const minutesUntilTask = differenceInMinutes(taskDateTime, now);
      
      // Enhanced debug logging
      console.log("📊 Task Details:", {
        taskId: task.id,
        taskTitle: task.title,
        taskDate: task.date,
        taskTime: task.start_time,
        taskDateTime: taskDateTime.toLocaleString(),
        currentTime: now.toLocaleString(),
        minutesUntilTask: minutesUntilTask,
        isSameMinute: isSameMinute(taskDateTime, now),
        timeUntilNotification: `${Math.floor(minutesUntilTask / 60)}h ${minutesUntilTask % 60}m`
      });

      // Check if current time matches task start time exactly
      if (isSameMinute(taskDateTime, now)) {
        console.log("✅ Time match found! Sending notification for task:", task.title);
        
        if ("Notification" in window && Notification.permission === "granted") {
          const timeString = format(taskDateTime, "h:mm a");
          
          // Check if service worker is available
          if (!('serviceWorker' in navigator)) {
            console.error("Service Worker not supported in this browser");
            return;
          }

          navigator.serviceWorker.ready.then(registration => {
            console.log("Service worker ready, showing notification");
            registration.showNotification("Task Starting Now", {
              body: `${task.title} is starting now at ${timeString}`,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
              vibrate: [200, 100, 200],
              data: {
                taskId: task.id,
                url: window.location.origin + '/dashboard'
              },
              tag: `task-${task.id}`,
              renotify: true,
              requireInteraction: true,
              silent: false
            }).then(() => {
              // Add to notified tasks after successful notification
              notifiedTasks.add(task.id);
              console.log("✅ Notification sent successfully");
            }).catch(error => {
              console.error("❌ Error showing notification:", error);
            });
          }).catch(error => {
            console.error("❌ Error with service worker:", error);
          });
        } else {
          console.log("❌ Notifications not granted:", Notification.permission);
        }
      } else {
        console.log("⏳ Task not due for notification yet - Time until notification:", `${Math.floor(minutesUntilTask / 60)}h ${minutesUntilTask % 60}m`);
      }
    });
    
    console.log("=================== CHECK COMPLETE ===================\n");
  } catch (error) {
    console.error("Error checking upcoming tasks:", error);
  }
};
