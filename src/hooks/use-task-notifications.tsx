
import { useEffect, useRef } from 'react';
import { showNotification } from '@/utils/notifications/notificationUtils';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/components/dashboard/TaskBoard';
import { isToday, parseISO, isFuture } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const NOTIFICATION_CHECK_INTERVAL = 30000; // Check every 30 seconds

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());

  const checkForUpcomingTasks = async (tasks: Task[]) => {
    // Get user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    
    for (const task of tasks) {
      try {
        // Skip if task has been notified or doesn't have reminders enabled
        if (!task.reminder_enabled || notifiedTasksRef.current.has(task.id)) {
          continue;
        }

        // Only check scheduled tasks with a date and start time
        if (task.status === 'scheduled' && task.date && task.start_time) {
          const taskDate = parseISO(task.date);
          
          // Only process today's and future tasks
          if (!isToday(taskDate) && !isFuture(taskDate)) {
            continue;
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

          // Check if we're within the reminder window
          const reminderWindowStart = task.reminder_time + 0.5;
          const reminderWindowEnd = task.reminder_time - 0.5;
          
          if (minutesUntilTask <= reminderWindowStart && 
              minutesUntilTask > reminderWindowEnd) {
            const notificationSent = await showNotification(task, 'reminder');
            
            if (notificationSent) {
              console.log('✅ Reminder notification sent successfully');
              notifiedTasksRef.current.add(task.id);
            }
          }
        }
      } catch (error) {
        console.error('Error processing task notification:', error);
      }
    }
  };

  useEffect(() => {
    // Check immediately on mount or tasks change
    if (tasks.length > 0) {
      void checkForUpcomingTasks(tasks);
    }

    // Set up interval for regular checks
    const intervalId = setInterval(() => {
      if (tasks.length > 0) {
        void checkForUpcomingTasks(tasks);
      }
    }, NOTIFICATION_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [tasks]);
}
