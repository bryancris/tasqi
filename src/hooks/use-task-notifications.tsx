
import { useEffect, useRef, useCallback } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/components/dashboard/TaskBoard';
import { isToday, parseISO, isFuture } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { useNotifications } from '@/hooks/notifications/use-notifications';
import { showBrowserNotification, playNotificationSound } from '@/utils/notifications/notificationUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Increase check interval to reduce frequency
const NOTIFICATION_CHECK_INTERVAL = 60000; // Check every 60 seconds

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());
  const { showNotification } = useNotifications();
  const queryClient = useQueryClient();
  
  // Add a tracking ref for the last check time to avoid redundant checks
  const lastCheckTimeRef = useRef<number>(0);
  
  // Add tracking for is mounted to prevent updates on unmounted component
  const isMountedRef = useRef<boolean>(true);

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
    if (!isMountedRef.current) return false;
    
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

      // IMPORTANT: Set explicit string type for the referenceId to ensure consistent handling
      const referenceIdString = String(task.id);
      
      console.log('📱 Creating notification with referenceId:', referenceIdString, 'Type:', typeof referenceIdString);

      // Show in-app notification with task ID reference as string
      showNotification({
        title: type === 'reminder' ? 'Task Reminder' :
               type === 'shared' ? 'Task Shared' :
               'New Task Assignment',
        message: task.title,
        type: 'info',
        persistent: true,
        referenceId: referenceIdString,
        referenceType: 'task',
        action: {
          label: 'Complete Task',
          onClick: () => void handleTaskComplete(task)
        }
      });

      return true;
    } catch (error) {
      if (isMountedRef.current) {
        console.error('❌ Error showing notification:', error);
      }
      return false;
    }
  }, [showNotification, queryClient]);

  const checkForUpcomingTasks = useCallback(async (tasks: Task[]) => {
    if (!isMountedRef.current) return;
    
    // Skip checking if last check was too recent (within last 5 seconds)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 5000) {
      return; // Skip this check, it's too soon after the last one
    }
    
    // Update last check time
    lastCheckTimeRef.current = now;
    
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentTime = new Date();
    
    // Only check tasks that need to be checked
    const tasksToCheck = tasks.filter(task => 
      task.reminder_enabled && 
      !notifiedTasksRef.current.has(task.id) &&
      task.status === 'scheduled' && 
      task.date && 
      task.start_time &&
      (isToday(parseISO(task.date)) || isFuture(parseISO(task.date)))
    );
    
    for (const task of tasksToCheck) {
      if (!isMountedRef.current) break;
      
      try {
        const taskDate = parseISO(task.date!);
        
        const [hours, minutes] = task.start_time!.split(':').map(Number);
        const taskDateString = formatInTimeZone(taskDate, userTimeZone, 'yyyy-MM-dd');
        const taskTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const taskDateTimeString = `${taskDateString}T${taskTimeString}`;
        
        const taskDateTime = toZonedTime(new Date(taskDateTimeString), userTimeZone);
        const timeUntilTask = taskDateTime.getTime() - currentTime.getTime();
        const minutesUntilTask = timeUntilTask / (1000 * 60);

        const reminderWindowStart = task.reminder_time! + 0.5;
        const reminderWindowEnd = task.reminder_time! - 0.5;
        
        if (minutesUntilTask <= reminderWindowStart && 
            minutesUntilTask > reminderWindowEnd) {
          const notificationSent = await showTaskNotification(task, 'reminder');
          
          if (notificationSent && isMountedRef.current) {
            console.log('✅ Reminder notification sent successfully');
            notifiedTasksRef.current.add(task.id);
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('Error processing task notification:', error);
        }
      }
    }
  }, [showTaskNotification]);

  useEffect(() => {
    console.log('🔔 Task notifications hook initialized');
    isMountedRef.current = true;
    
    // Initial check on mount if we have tasks
    if (tasks.length > 0) {
      void checkForUpcomingTasks(tasks);
    }

    const intervalId = setInterval(() => {
      if (isMountedRef.current && tasks.length > 0) {
        void checkForUpcomingTasks(tasks);
      }
    }, NOTIFICATION_CHECK_INTERVAL);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      console.log('🔔 Task notifications hook cleanup');
    };
  }, [tasks, checkForUpcomingTasks]);

  return {
    handleTaskComplete,
    showTaskNotification
  };
}
