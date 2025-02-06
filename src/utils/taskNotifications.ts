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
      .gte("date", today); // Only get today's and future tasks

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
      const hoursUntil = Math.floor(Math.abs(minutesUntilTask) / 60);
      const minutesRemaining = Math.abs(minutesUntilTask) % 60;
      
      // Enhanced debug logging
      console.log("📊 Task Details:", {
        taskId: task.id,
        taskTitle: task.title,
        taskDate: task.date,
        taskTime: task.start_time,
        taskDateTime: taskDateTime.toLocaleString(),
        currentTime: now.toLocaleString(),
        minutesUntilTask: minutesUntilTask,
        secondsUntilTask: secondsUntilTask,
        timeUntilTask: minutesUntilTask >= 0 
          ? `⏳ Task starts in ${hoursUntil}h ${minutesRemaining}m`
          : `⌛ Task started ${hoursUntil}h ${minutesRemaining}m ago`,
        isSameMinute: isSameMinute(taskDateTime, now),
        reminderEnabled: task.reminder_enabled,
        status: task.status
      });

      // Check if we're within 30 seconds before or after the task start time
      const isWithinNotificationWindow = Math.abs(secondsUntilTask) <= 30;
      
      if (isWithinNotificationWindow) {
        console.log("🎯 Within notification window! Sending notification for task:", task.title);
        
        if ("Notification" in window && Notification.permission === "granted") {
          const timeString = format(taskDateTime, "h:mm a");
          
          // Check if service worker is available
          if (!('serviceWorker' in navigator)) {
            console.error("❌ Service Worker not supported in this browser");
            return;
          }

          console.log("🔄 Getting service worker registration...");
          navigator.serviceWorker.ready.then(registration => {
            console.log("✅ Service worker ready, attempting to show notification");
            return registration.showNotification("Task Starting Now", {
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
            });
          }).then(() => {
            // Add to notified tasks after successful notification
            notifiedTasks.add(task.id);
            console.log("✅ Notification sent successfully for task:", task.title);
          }).catch(error => {
            console.error("❌ Error showing notification:", error, {
              error: error.toString(),
              stack: error.stack
            });
          });
        } else {
          console.log("❌ Notifications not available or not granted:", {
            notificationInWindow: "Notification" in window,
            permission: Notification.permission
          });
        }
      }
    });
    
    console.log("\n==================== ✅ CHECK COMPLETE ✅ ====================\n");
  } catch (error) {
    console.error("❌ Error checking upcoming tasks:", error);
  }
};
