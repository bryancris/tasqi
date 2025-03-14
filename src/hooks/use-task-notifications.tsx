
/**
 * Hook: useTaskNotifications
 * 
 * Purpose:
 * - Manages the task notification system by periodically checking for upcoming tasks
 * - Tracks which tasks have already been notified to prevent duplicate notifications
 * - Provides functions to show task notifications and test notifications
 * - Cleans up resources when the component unmounts
 * 
 * Important Notes:
 * - Uses a 30-second interval to check for upcoming tasks
 * - Maintains a Set of already notified tasks to prevent duplicates
 * - The test notification function is useful for debugging notification display
 * 
 * Example Usage:
 * const { handleTaskComplete, showTaskNotification, triggerTestNotification } = useTaskNotifications();
 * triggerTestNotification(); // To test notification display
 */

import { useEffect, useRef } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useNotifications } from '@/hooks/notifications/use-notifications';
import { useTaskCompletion } from '@/hooks/notifications/use-task-completion';
import { useTaskNotificationDisplay } from '@/hooks/notifications/use-task-notification-display';
import { useTaskChecker } from '@/hooks/notifications/use-task-checker';

// Decrease check interval to increase frequency
const NOTIFICATION_CHECK_INTERVAL = 30000; // Check every 30 seconds (reduced from 60)

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

  // Enhanced test notification function that creates a notification with proper structure for button display
  const triggerTestNotification = () => {
    console.log('🧪 Triggering test notification with ID: 999999');
    
    if (isMountedRef.current) {
      console.log(`✅ Creating test notification with ID: 999999, type: task`);
      
      // Create a notification with ALL properties needed for task buttons
      showNotification({
        title: "Task Reminder",
        message: "This is a test notification with action buttons",
        type: "info",
        persistent: true,
        referenceId: "999999",  // MUST be string format for consistent handling
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
      console.log('📋 Initial task check on mount with tasks:', tasks.length);
      void checkForUpcomingTasks(
        tasks, 
        isMountedRef, 
        notifiedTasksRef, 
        (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
      );
    }

    // Perform an immediate check after a short delay (to let the app stabilize)
    const initialCheckTimeout = setTimeout(() => {
      if (isMountedRef.current && tasks.length > 0) {
        console.log('📋 Running delayed initial task check with tasks:', tasks.length);
        void checkForUpcomingTasks(
          tasks, 
          isMountedRef, 
          notifiedTasksRef, 
          (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
        );
      }
    }, 2000);

    const intervalId = setInterval(() => {
      if (isMountedRef.current && tasks.length > 0) {
        console.log('📋 Periodic task check with tasks:', tasks.length);
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
      clearTimeout(initialCheckTimeout);
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
