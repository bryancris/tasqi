
import { useEffect, useRef } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useNotifications } from '@/hooks/notifications/use-notifications';
import { useTaskCompletion } from '@/hooks/notifications/use-task-completion';
import { useTaskNotificationDisplay } from '@/hooks/notifications/use-task-notification-display';
import { useTaskChecker } from '@/hooks/notifications/use-task-checker';

// Increase check interval to reduce frequency
const NOTIFICATION_CHECK_INTERVAL = 60000; // Check every 60 seconds

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());
  const { showNotification } = useNotifications();
  
  // Add tracking for is mounted to prevent updates on unmounted component
  const isMountedRef = useRef<boolean>(true);

  // Import handlers from refactored hooks
  const { handleTaskComplete } = useTaskCompletion();
  const { showTaskNotification } = useTaskNotificationDisplay();
  const { checkForUpcomingTasks } = useTaskChecker();

  // Improved test notification function with guaranteed structure
  const triggerTestNotification = () => {
    console.log('🧪 Triggering test notification with ID: 999999');
    
    if (isMountedRef.current) {
      console.log(`✅ Creating test notification with ID: 999999, type: task`);
      
      // Create a simplified test notification with a consistent structure
      // The referenceId and referenceType fields are crucial for button display
      showNotification({
        title: "Task Reminder",
        message: "This is a test notification with action buttons",
        type: "info",
        persistent: true,
        referenceId: "999999",  // String format
        referenceType: "task",  // MUST be "task" to trigger task-specific buttons
        group: "test-notification"
      });
    } else {
      console.log('❌ Cannot trigger test notification - component unmounted');
    }
  };

  useEffect(() => {
    console.log('🔔 Task notifications hook initialized');
    isMountedRef.current = true;
    
    // Initial check on mount if we have tasks
    if (tasks.length > 0) {
      void checkForUpcomingTasks(
        tasks, 
        isMountedRef, 
        notifiedTasksRef, 
        (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
      );
    }

    const intervalId = setInterval(() => {
      if (isMountedRef.current && tasks.length > 0) {
        void checkForUpcomingTasks(
          tasks, 
          isMountedRef, 
          notifiedTasksRef, 
          (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
        );
      }
    }, NOTIFICATION_CHECK_INTERVAL);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      console.log('🔔 Task notifications hook cleanup');
    };
  }, [tasks, checkForUpcomingTasks, showTaskNotification, handleTaskComplete, showNotification]);

  return {
    handleTaskComplete,
    showTaskNotification: (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete),
    triggerTestNotification
  };
}
