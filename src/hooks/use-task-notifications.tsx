
import { useEffect, useRef } from 'react';
import { showNotification } from '@/utils/notifications/notificationUtils';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/components/dashboard/TaskBoard';
import { isToday, parseISO, isFuture } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const NOTIFICATION_CHECK_INTERVAL = 60000; // Check every minute
const NOTIFICATION_THRESHOLD_MINUTES = 15; // Notify 15 minutes before task

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());

  const checkForUpcomingTasks = (tasks: Task[]) => {
    // Get user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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

        // Convert task time to user's timezone
        const [hours, minutes] = task.start_time.split(':').map(Number);
        const taskDateString = formatInTimeZone(taskDate, userTimeZone, 'yyyy-MM-dd');
        const taskTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const taskDateTimeString = `${taskDateString}T${taskTimeString}`;
        
        // Create a date object in user's timezone
        const taskDateTime = toZonedTime(new Date(taskDateTimeString), userTimeZone);

        // Calculate time until task
        const timeUntilTask = taskDateTime.getTime() - now.getTime();
        const minutesUntilTask = timeUntilTask / (1000 * 60);

        // If task is within notification threshold and hasn't been notified
        if (minutesUntilTask <= NOTIFICATION_THRESHOLD_MINUTES && minutesUntilTask > 0) {
          showNotification(task)
            .then(() => {
              console.log('✅ Notification sent for task:', task.title);
              console.log('🕒 Task time:', formatInTimeZone(taskDateTime, userTimeZone, 'yyyy-MM-dd HH:mm:ss'));
              console.log('🌍 User timezone:', userTimeZone);
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
