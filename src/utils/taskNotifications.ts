import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/components/dashboard/TaskBoard";

export async function checkAndNotifyUpcomingTasks() {
  try {
    // Get current time in 24-hour format
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const currentDate = now.toISOString().split('T')[0];

    console.log('Checking tasks at:', currentTime, 'on', currentDate);

    // Fetch tasks that are scheduled for today
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('date', currentDate)
      .eq('status', 'scheduled');

    if (error) throw error;

    // Check each task's start time
    tasks?.forEach((task: Task) => {
      if (!task.start_time) return;

      // Convert task start time to 24-hour format for comparison
      const taskDate = new Date();
      const [taskHours, taskMinutes] = task.start_time.split(':');
      taskDate.setHours(parseInt(taskHours), parseInt(taskMinutes), 0, 0);
      const taskTime = taskDate.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      console.log('Comparing task:', task.title, 'scheduled for:', taskTime, 'with current time:', currentTime);

      if (taskTime === currentTime) {
        console.log('Task due, sending notification for:', task.title);
        
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
              tag: `task-${task.id}`,
              data: {
                taskId: task.id,
                url: window.location.origin + '/dashboard'
              }
            });
          });
        } else {
          console.log('Notifications not granted or service worker not available');
        }
      }
    });
  } catch (error) {
    console.error('Error checking for task notifications:', error);
  }
}