import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";

export async function checkAndNotifyUpcomingTasks() {
  try {
    // Get current time
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const currentDate = now.toISOString().split('T')[0];

    // Fetch tasks that are scheduled for today
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('date', currentDate)
      .eq('status', 'scheduled');

    if (error) throw error;

    // Check each task's start time
    tasks?.forEach((task: Task) => {
      if (task.start_time === currentTime) {
        // Request notification permission if not granted
        if (Notification.permission === "default") {
          Notification.requestPermission();
        }

        // Send notification through service worker
        if (Notification.permission === "granted" && 'serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification("Task Due", {
              body: task.title,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              vibrationPattern: [100, 50, 100],
              data: {
                taskId: task.id,
                url: window.location.origin + '/dashboard'
              }
            });
          });
        }
      }
    });
  } catch (error) {
    console.error('Error checking for task notifications:', error);
  }
}