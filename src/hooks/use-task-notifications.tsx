
import { useEffect, useRef } from 'react';
import { showNotification } from '@/utils/notifications/notificationUtils';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/components/dashboard/TaskBoard';
import { isToday, parseISO, isFuture, addMinutes } from 'date-fns';

const NOTIFICATION_CHECK_INTERVAL = 60000; // Check every minute
const NOTIFICATION_THRESHOLD_MINUTES = 15; // Notify 15 minutes before task

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());

  const checkForUpcomingTasks = (tasks: Task[]) => {
    const now = new Date();
    
    tasks.forEach(task => {
      // Skip if task has been notified or doesn't have reminders enabled
      if (!task.reminder_enabled || notifiedTasksRef.current.has(task.id)) {
        return;
      }

      // Only check scheduled tasks with a date and start time
      if (task.status === 'scheduled' && task.date && task.start_time) {
        const taskDate = parseISO(task.date);
        
        // Only process today's and future tasks
        if (!isToday(taskDate) && !isFuture(taskDate)) {
          return;
        }

        const [hours, minutes] = task.start_time.split(':').map(Number);
        const taskDateTime = new Date(taskDate);
        taskDateTime.setHours(hours, minutes);

        // Calculate time until task
        const timeUntilTask = taskDateTime.getTime() - now.getTime();
        const minutesUntilTask = timeUntilTask / (1000 * 60);

        // If task is within notification threshold and hasn't been notified
        if (minutesUntilTask <= NOTIFICATION_THRESHOLD_MINUTES && minutesUntilTask > 0) {
          showNotification(task)
            .then(() => {
              console.log('✅ Notification sent for task:', task.title);
              notifiedTasksRef.current.add(task.id);
            })
            .catch(error => {
              console.error('❌ Error showing notification:', error);
            });
        }
      }
    });
  };

  useEffect(() => {
    // Check immediately on mount or tasks change
    if (tasks.length > 0) {
      checkForUpcomingTasks(tasks);
    }

    // Set up interval for regular checks
    const intervalId = setInterval(() => {
      if (tasks.length > 0) {
        checkForUpcomingTasks(tasks);
      }
    }, NOTIFICATION_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [tasks]);
}
