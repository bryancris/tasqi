
/**
 * Hook: useTaskNotificationDisplay
 * 
 * Purpose:
 * - Creates and displays notifications for tasks (reminders, shared tasks, assignments)
 * - Formats notification data with consistent types
 * - Ensures notifications have proper referenceId and referenceType for button display
 * - Triggers browser notifications and sounds
 * 
 * Important Notes:
 * - Always converts referenceId to string for consistent handling across the app
 * - Sets referenceType as 'task' to ensure notification buttons are displayed
 * - Used by the task notification system to show reminders
 * 
 * Example Usage:
 * const { showTaskNotification } = useTaskNotificationDisplay();
 * showTaskNotification(task, 'reminder', isMountedRef, handleTaskComplete);
 */

import { Task } from '@/components/dashboard/TaskBoard';
import { useCallback } from 'react';
import { useNotifications } from '@/hooks/notifications/use-notifications';
import { showBrowserNotification, playNotificationSound } from '@/utils/notifications/notificationUtils';

export function useTaskNotificationDisplay() {
  const { showNotification } = useNotifications();

  const showTaskNotification = useCallback(async (
    task: Task, 
    type: 'reminder' | 'shared' | 'assignment' = 'reminder',
    isMounted: React.MutableRefObject<boolean>,
    handleTaskComplete: (task: Task) => Promise<void>
  ) => {
    if (!isMounted.current) return false;
    
    try {
      console.log('🔔 Showing notification:', {
        taskId: task.id,
        type,
        title: task.title,
        reminderTime: task.reminder_time,
        isAtStartTime: task.reminder_time === 0
      });

      // Show browser notification if window is not focused
      await showBrowserNotification(task, type);

      // Play notification sound
      await playNotificationSound();

      // IMPORTANT: ALWAYS convert referenceId to string for consistent handling
      const referenceIdString = String(task.id);
      
      // CRITICAL FIX: Explicitly set the isAtStartTime flag for task reminder notifications
      // This ensures it's consistently set throughout the notification pipeline
      const isAtStartTime = task.reminder_time === 0;
      console.log(`📱 Creating notification with reminderTime=${task.reminder_time}, isAtStartTime=${isAtStartTime}`);

      // Ensure we set referenceType as 'task' consistently for all task notifications
      showNotification({
        title: type === 'reminder' ? 'Task Reminder' :
               type === 'shared' ? 'Task Shared' :
               'New Task Assignment',
        message: task.title,
        type: 'info',
        persistent: true,
        referenceId: referenceIdString,
        referenceType: 'task', // Always set as 'task' to trigger button display
        data: {
          reminderTime: task.reminder_time,
          isAtStartTime: isAtStartTime
        }
      });

      return true;
    } catch (error) {
      if (isMounted.current) {
        console.error('❌ Error showing notification:', error);
      }
      return false;
    }
  }, [showNotification]);

  return { showTaskNotification };
}
