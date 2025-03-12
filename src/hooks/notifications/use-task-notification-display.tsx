
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
        title: task.title
      });

      // Show browser notification if window is not focused
      await showBrowserNotification(task, type);

      // Play notification sound
      await playNotificationSound();

      // IMPORTANT: ALWAYS convert referenceId to string for consistent handling
      const referenceIdString = String(task.id);
      
      console.log('📱 Creating notification with referenceId:', referenceIdString, 'Type:', typeof referenceIdString);

      // Ensure we set referenceType as 'task' consistently for all task notifications
      showNotification({
        title: type === 'reminder' ? 'Task Reminder' :
               type === 'shared' ? 'Task Shared' :
               'New Task Assignment',
        message: task.title,
        type: 'info',
        persistent: true,
        referenceId: referenceIdString,
        referenceType: 'task' // Always set as 'task' to trigger button display
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
