
import { useEffect, useRef, useCallback } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/components/dashboard/TaskBoard';
import { isToday, parseISO, isFuture } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { useNotifications } from '@/components/notifications/NotificationsManager';
import { showBrowserNotification, playNotificationSound } from '@/utils/notifications/notificationUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const NOTIFICATION_CHECK_INTERVAL = 30000; // Check every 30 seconds

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();

  const handleTaskComplete = async (task: Task) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      if (task.shared) {
        const { error: sharedUpdateError } = await supabase
          .from('shared_tasks')
          .update({ status: 'completed' })
          .eq('task_id', task.id)
          .eq('shared_with_user_id', user.id);

        if (sharedUpdateError) {
          console.error('Error completing shared task:', sharedUpdateError);
          toast.error('Failed to complete task');
          return;
        }
      } else {
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (updateError) {
          console.error('Error completing task:', updateError);
          toast.error('Failed to complete task');
          return;
        }
      }

      toast.success('Task completed');
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Unexpected error completing task:', error);
      toast.error('An unexpected error occurred');
    }
  };

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

      // Show in-app notification with explicit task ID reference
      showNotification({
        title: type === 'reminder' ? 'Task Reminder' :
               type === 'shared' ? 'Task Shared' :
               'New Task Assignment',
        message: task.title,
        type: 'info',
        persistent: true,
        reference_id: task.id.toString(), // Explicitly pass the task ID
        reference_type: 'task',
        action: {
          label: 'Complete Task',
          onClick: () => void handleTaskComplete(task)
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return false;
    }
  }, [showNotification, queryClient]);

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
