
import { useEffect, useRef, useCallback } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/components/dashboard/TaskBoard';
import { isToday, parseISO, isFuture } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { useNotifications } from '@/components/notifications/NotificationsManager';
import { showBrowserNotification, playNotificationSound } from '@/utils/notifications/notificationUtils';

const NOTIFICATION_CHECK_INTERVAL = 30000; // Check every 30 seconds

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());
  const { showNotification } = useNotifications();

  const showTaskNotification = useCallback(async (task: Task, type: 'reminder' | 'shared' | 'assignment' = 'reminder') => {
    try {
      console.log('🔔 Showing notification:', {
        taskId: task.id,
        type,
        title: task.title
      });

      // Show browser notification if window is not focused
      await showBrowserNotification(task, type);

      // Play notification sound
      await playNotificationSound();

      // Show in-app notification
      showNotification({
        title: type === 'reminder' ? 'Task Reminder' :
               type === 'shared' ? 'Task Shared' :
               'New Task Assignment',
        message: task.title,
        type: 'info',
        action: {
          label: 'View Task',
          onClick: () => {
            if (location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
            }
          }
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return false;
    }
  }, [showNotification]);

  const checkForUpcomingTasks = useCallback(async (tasks: Task[]) => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    
    for (const task of tasks) {
      try {
        if (!task.reminder_enabled || notifiedTasksRef.current.has(task.id)) {
          continue;
        }

        if (task.status === 'scheduled' && task.date && task.start_time) {
          const taskDate = parseISO(task.date);
          
          if (!isToday(taskDate) && !isFuture(taskDate)) {
            continue;
          }

          const [hours, minutes] = task.start_time.split(':').map(Number);
          const taskDateString = formatInTimeZone(taskDate, userTimeZone, 'yyyy-MM-dd');
          const taskTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
          const taskDateTimeString = `${taskDateString}T${taskTimeString}`;
          
          const taskDateTime = toZonedTime(new Date(taskDateTimeString), userTimeZone);
          const timeUntilTask = taskDateTime.getTime() - now.getTime();
          const minutesUntilTask = timeUntilTask / (1000 * 60);

          const reminderWindowStart = task.reminder_time + 0.5;
          const reminderWindowEnd = task.reminder_time - 0.5;
          
          if (minutesUntilTask <= reminderWindowStart && 
              minutesUntilTask > reminderWindowEnd) {
            const notificationSent = await showTaskNotification(task, 'reminder');
            
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
  }, [showTaskNotification]);

  useEffect(() => {
    if (tasks.length > 0) {
      void checkForUpcomingTasks(tasks);
    }

    const intervalId = setInterval(() => {
      if (tasks.length > 0) {
        void checkForUpcomingTasks(tasks);
      }
    }, NOTIFICATION_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [tasks, checkForUpcomingTasks]);
}
