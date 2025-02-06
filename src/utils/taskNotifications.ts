import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes, differenceInSeconds, isSameMinute } from "date-fns";

// Keep track of notifications we've already sent
const notifiedTasks = new Set<number>();

export const checkAndNotifyUpcomingTasks = async () => {
  try {
    console.log("\n==================== 🔔 TASK NOTIFICATION CHECK 🔔 ====================");
    const now = new Date();
    console.log("⏰ Current time:", now.toLocaleString());
    
    // First check if notifications are supported and permitted
    if (!("Notification" in window)) {
      console.error("❌ This browser does not support notifications");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      console.error("❌ Service Worker not supported");
      return;
    }

    console.log("📱 Current notification permission:", Notification.permission);
    
    // If permission is not granted, request it
    if (Notification.permission !== "granted") {
      console.log("🔄 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("✉️ Permission response:", permission);
      if (permission !== "granted") {
        console.log("❌ Notification permission not granted");
        return;
      }
    }

    // Get tasks for today that are scheduled and have reminders enabled
    const today = format(now, 'yyyy-MM-dd');
    console.log("📅 Checking tasks for date:", today);

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "scheduled")
      .eq("reminder_enabled", true)
      .gte("date", today);

    if (error) {
      console.error("❌ Error fetching tasks:", error);
      throw error;
    }

    console.log(`📋 Found ${tasks?.length || 0} upcoming tasks with reminders enabled`);

    tasks?.forEach(task => {
      console.log("\n🔍 Checking task:", task.title);
      
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
      const secondsUntilTask = differenceInSeconds(taskDateTime, now);
      
      console.log("📊 Task Details:", {
        taskId: task.id,
        taskTitle: task.title,
        taskDate: task.date,
        taskTime: task.start_time,
        taskDateTime: taskDateTime.toLocaleString(),
        currentTime: now.toLocaleString(),
        minutesUntilTask,
        secondsUntilTask,
        reminderEnabled: task.reminder_enabled,
        status: task.status
      });

      // Check if we're within 30 seconds before or after the task start time
      const isWithinNotificationWindow = Math.abs(secondsUntilTask) <= 30;
      
      if (isWithinNotificationWindow) {
        console.log("🎯 Within notification window! Sending notification for task:", task.title);
        
        const timeString = format(taskDateTime, "h:mm a");
        const notificationTitle = `Task Starting Now: ${task.title}`;
        const notificationBody = `Your task "${task.title}" is starting now at ${timeString}`;

        // Get service worker registration and show notification
        navigator.serviceWorker.ready.then(registration => {
          console.log("✅ Service worker ready, showing notification...");
          return registration.showNotification(notificationTitle, {
            body: notificationBody,
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
          });
        }).then(() => {
          notifiedTasks.add(task.id);
          console.log("✅ Notification sent successfully for task:", task.title);
        }).catch(error => {
          console.error("❌ Error showing notification:", error);
          console.error("Error details:", {
            message: error.message,
            stack: error.stack
          });
        });
      }
    });
    
    console.log("\n==================== ✅ CHECK COMPLETE ✅ ====================\n");
  } catch (error) {
    console.error("❌ Error in checkAndNotifyUpcomingTasks:", error);
    throw error; // Re-throw to ensure the error appears in the console
  }
};
