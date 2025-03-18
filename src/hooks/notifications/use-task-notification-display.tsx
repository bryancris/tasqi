
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
import { showBrowserNotification } from '@/utils/notifications/notificationUtils';
import { playNotificationSound } from '@/utils/notifications/soundUtils';

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
        reminderTime: task.reminder_time
      });

      // CRITICAL FIX: Add more logging to confirm we're sending notifications properly
      console.log('🔈 Playing notification sound...');
      let soundPlayed = false;
      try {
        // Play notification sound first for better user experience
        // FIX: Make sure we get a boolean return value, not void
        const soundResult = await playNotificationSound();
        // CRITICAL FIX: Explicitly check for true boolean result
        soundPlayed = soundResult === true;
        console.log('🔈 Sound played successfully:', soundPlayed);
      } catch (soundError) {
        console.error('🔈 Error playing sound:', soundError);
      }

      // CRITICAL FIX: Show browser notification with better error handling
      console.log('🌐 Showing browser notification...');
      let browserNotificationShown = false;
      try {
        // Show browser notification if window is not focused
        // FIX: Make sure we explicitly handle the return value as boolean
        const showResult = await showBrowserNotification(task, type);
        // Ensure we have a boolean by explicitly checking if it's true
        browserNotificationShown = showResult === true;
        console.log('🌐 Browser notification shown successfully:', browserNotificationShown);
      } catch (browserError) {
        console.error('🌐 Error showing browser notification:', browserError);
      }

      // IMPORTANT: ALWAYS convert referenceId to string for consistent handling
      const referenceIdString = String(task.id);
      
      console.log('📱 Creating in-app notification for task:', referenceIdString);

      // Ensure we set referenceType as 'task' consistently for all task notifications
      const wasNotificationShown = await showNotification({
        title: type === 'reminder' ? 'Task Reminder' :
               type === 'shared' ? 'Task Shared' :
               'New Task Assignment',
        message: task.title,
        type: 'info',
        persistent: true,
        referenceId: referenceIdString,
        referenceType: 'task', // Always set as 'task' to trigger button display
        data: {
          reminderTime: task.reminder_time
        }
      });
      
      console.log('📱 In-app notification creation result:', wasNotificationShown ? 'SUCCESS' : 'FAILED');

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
