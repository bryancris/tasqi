
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInSeconds } from "date-fns";

const notifiedTasks = new Set<number>();

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  try {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker not supported");
    }

    // Unregister existing service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }

    console.log("Registering new service worker...");
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log("Service worker registered:", registration);

    // Wait for the service worker to be activated
    if (!registration.active) {
      await new Promise<void>((resolve) => {
        registration.addEventListener('activate', () => {
          console.log("Service worker activated");
          resolve();
        });
      });
    }

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    throw error;
  }
};

export const checkAndNotifyUpcomingTasks = async () => {
  try {
    console.log("\n==================== 🔔 TASK NOTIFICATION CHECK 🔔 ====================");
    const now = new Date();
    
    if (!("Notification" in window)) {
      console.error("❌ This browser does not support notifications");
      return;
    }

    if (Notification.permission !== "granted") {
      console.log("🔄 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("❌ Notification permission not granted");
        return;
      }
    }

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

    const registration = await registerServiceWorker();
    console.log("✅ Service worker registered and activated");

    tasks?.forEach(task => {
      if (!task.date || !task.start_time) return;
      
      if (notifiedTasks.has(task.id)) {
        console.log("⏭️ Already notified about task:", task.id);
        return;
      }

      const taskDateTime = parseISO(`${task.date}T${task.start_time}`);
      const secondsUntilTask = differenceInSeconds(taskDateTime, now);
      
      console.log("📊 Task Details:", {
        taskId: task.id,
        taskTitle: task.title,
        taskDateTime: taskDateTime.toLocaleString(),
        secondsUntilTask
      });

      if (Math.abs(secondsUntilTask) <= 30) {
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
          requireInteraction: true
        }).then(() => {
          notifiedTasks.add(task.id);
          console.log("✅ Notification sent successfully for task:", task.title);
        }).catch(error => {
          console.error("❌ Error showing notification:", error);
        });
      }
    });
    
    console.log("\n==================== ✅ CHECK COMPLETE ✅ ====================\n");
  } catch (error) {
    console.error("❌ Error in checkAndNotifyUpcomingTasks:", error);
    throw error;
  }
};
