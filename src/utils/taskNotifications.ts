
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes, differenceInSeconds, isSameMinute } from "date-fns";

// Keep track of notifications we've already sent
const notifiedTasks = new Set<number>();

// Helper function to register service worker
const registerServiceWorker = async () => {
  try {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }

    // Unregister any existing service workers first
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Wait for the service worker to be activated
    if (registration.active) {
      return registration;
    }

    // If not active yet, wait for activation
    return new Promise((resolve) => {
      registration.addEventListener('activate', () => resolve(registration));
    });
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    throw error;
  }
};

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
      .gte("date", today);

    if (error) {
      console.error("❌ Error fetching tasks:", error);
      throw error;
    }

    console.log(`📋 Found ${tasks?.length || 0} upcoming tasks with reminders enabled`);

    // Register service worker before processing tasks
    const registration = await registerServiceWorker();
    console.log("✅ Service worker registered and activated");

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
      const secondsUntilTask = differenceInSeconds(taskDateTime, now);
      
      console.log("📊 Task Details:", {
        taskId: task.id,
        taskTitle: task.title,
        taskDate: task.date,
        taskTime: task.start_time,
        taskDateTime: taskDateTime.toLocaleString(),
        currentTime: now.toLocaleString(),
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

        console.log("✅ Service worker ready, attempting to show notification");
        registration.showNotification(notificationTitle, {
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
    throw error;
  }
};
