
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
 * - Uses a 10-second interval to check for upcoming tasks (increased frequency)
 * - Maintains a Set of already notified tasks to prevent duplicates
 * - Includes special handling for newly created tasks to prevent immediate notifications
 */

import { useEffect, useRef, useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useNotifications } from '@/hooks/notifications/use-notifications';
import { useTaskCompletion } from '@/hooks/notifications/use-task-completion';
import { useTaskNotificationDisplay } from '@/hooks/notifications/use-task-notification-display';
import { useTaskChecker } from '@/hooks/notifications/use-task-checker';
import { preloadNotificationSounds } from '@/utils/notifications/soundUtils';

// FIXED: Decreased check interval to increase frequency and fix 5min reminder issue
const NOTIFICATION_CHECK_INTERVAL = 10000; // Check every 10 seconds (reduced from 15)

// FIXED: Decreased threshold for task creation to allow 5min reminders to work
const TASK_CREATION_THRESHOLD = 30000; // 30 seconds (reduced from 60)

export function useTaskNotifications() {
  const { tasks } = useTasks();
  const notifiedTasksRef = useRef<Set<number>>(new Set());
  const { showNotification } = useNotifications();
  
  // Add tracking for is mounted to prevent updates on unmounted component
  const isMountedRef = useRef<boolean>(true);
  
  // Add tracking for recently created tasks to prevent immediate notifications
  const recentlyCreatedTasksRef = useRef<Map<number, number>>(new Map());

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

  // Track task creation timestamps to prevent immediate notifications
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    const now = Date.now();
    // Check for new tasks to add to the recently created tasks map
    tasks.forEach(task => {
      if (!recentlyCreatedTasksRef.current.has(task.id)) {
        console.log(`📋 New task detected: ${task.id} - marking as recently created`);
        recentlyCreatedTasksRef.current.set(task.id, now);
      }
    });
    
    // Clean up old entries from the recently created tasks map
    Array.from(recentlyCreatedTasksRef.current.entries()).forEach(([taskId, timestamp]) => {
      if (now - timestamp > TASK_CREATION_THRESHOLD) {
        console.log(`📋 Task ${taskId} is no longer considered recently created`);
        recentlyCreatedTasksRef.current.delete(taskId);
      }
    });
  }, [tasks]);

  useEffect(() => {
    console.log('🔔 Task notifications hook initialized');
    isMountedRef.current = true;
    
    // FIXED: Preload notification sounds when hook initializes
    preloadNotificationSounds();
    
    // Initial check on mount if we have tasks
    if (tasks.length > 0) {
      console.log('📋 Initial task check on mount with tasks:', tasks.length);
      void checkForUpcomingTasks(
        tasks, 
        isMountedRef, 
        notifiedTasksRef,
        recentlyCreatedTasksRef, // Pass the recently created tasks ref
        (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
      );
    }

    // FIXED: Perform more frequent initial checks to catch tasks that might be due soon
    const initialCheckIds = [
      setTimeout(() => {
        if (isMountedRef.current && tasks.length > 0) {
          console.log('📋 First quick task check (1s) with tasks:', tasks.length);
          void checkForUpcomingTasks(
            tasks, 
            isMountedRef, 
            notifiedTasksRef,
            recentlyCreatedTasksRef,
            (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
          );
        }
      }, 1000),
      
      setTimeout(() => {
        if (isMountedRef.current && tasks.length > 0) {
          console.log('📋 Second quick task check (3s) with tasks:', tasks.length);
          void checkForUpcomingTasks(
            tasks, 
            isMountedRef, 
            notifiedTasksRef,
            recentlyCreatedTasksRef,
            (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
          );
        }
      }, 3000),
      
      setTimeout(() => {
        if (isMountedRef.current && tasks.length > 0) {
          console.log('📋 Third quick task check (5s) with tasks:', tasks.length);
          void checkForUpcomingTasks(
            tasks, 
            isMountedRef, 
            notifiedTasksRef,
            recentlyCreatedTasksRef,
            (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
          );
        }
      }, 5000)
    ];

    const intervalId = setInterval(() => {
      if (isMountedRef.current && tasks.length > 0) {
        console.log('📋 Periodic task check with tasks:', tasks.length);
        void checkForUpcomingTasks(
          tasks, 
          isMountedRef, 
          notifiedTasksRef,
          recentlyCreatedTasksRef, // Pass the recently created tasks ref
          (task, type) => showTaskNotification(task, type, isMountedRef, handleTaskComplete)
        );
      }
    }, NOTIFICATION_CHECK_INTERVAL);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      initialCheckIds.forEach(id => clearTimeout(id));
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
