
/**
 * Hook: useTaskChecker
 * 
 * Purpose:
 * - Checks for upcoming tasks that need notifications
 * - Calculates when tasks are due based on their scheduled time and reminder preferences
 * - Tracks notification state to prevent duplicate notifications
 * 
 * Important Notes:
 * - Uses the user's timezone for accurate scheduling
 * - Implements rate limiting to prevent excessive checking
 * - Only notifies for scheduled tasks with enabled reminders
 * 
 * Example Usage:
 * const { checkForUpcomingTasks } = useTaskChecker();
 * checkForUpcomingTasks(tasks, isMountedRef, notifiedTasksRef, showTaskNotification);
 */

import { Task } from '@/components/dashboard/TaskBoard';
import { useCallback, useRef } from 'react';
import { isToday, parseISO, isFuture } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export function useTaskChecker() {
  // Add a tracking ref for the last check time to avoid redundant checks
  const lastCheckTimeRef = useRef<number>(0);
  
  const checkForUpcomingTasks = useCallback(async (
    tasks: Task[], 
    isMounted: React.MutableRefObject<boolean>,
    notifiedTasks: React.MutableRefObject<Set<number>>,
    showTaskNotification: (task: Task, type: 'reminder' | 'shared' | 'assignment') => Promise<boolean>
  ) => {
    if (!isMounted.current) return;
    
    // Skip checking if last check was too recent (within last 5 seconds)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 5000) {
      return; // Skip this check, it's too soon after the last one
    }
    
    // Update last check time
    lastCheckTimeRef.current = now;
    
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentTime = new Date();
    
    // DEBUG: Log actual tasks being checked
    console.log(`📋 All tasks (${tasks.length}):`);
    tasks.forEach(task => {
      console.log(`- Task ${task.id}: ${task.title}, status: ${task.status}, reminder: ${task.reminder_enabled ? 'ON' : 'OFF'}, notified: ${notifiedTasks.current.has(task.id)}`);
    });
    
    // Only check tasks that need to be checked
    const tasksToCheck = tasks.filter(task => 
      task.reminder_enabled && 
      !notifiedTasks.current.has(task.id) &&
      task.status === 'scheduled' && 
      task.date && 
      task.start_time
    );
    
    console.log(`⏰ Checking ${tasksToCheck.length} tasks for notifications at ${currentTime.toISOString()} (${userTimeZone})`);
    
    // DEBUG: Log which tasks passed initial filter
    tasksToCheck.forEach(task => {
      console.log(`- Task ${task.id} (${task.title}) passed initial filter: reminder=${task.reminder_enabled}, time=${task.start_time}, date=${task.date}`);
    });
    
    if (tasksToCheck.length === 0) {
      console.log('👉 No eligible tasks found for notification check');
    }
    
    for (const task of tasksToCheck) {
      if (!isMounted.current) break;
      
      try {
        // Log task ID for debugging
        console.log(`📋 Processing task ${task.id} (${task.title}):`);
        
        // DEBUG: Full task object dump for debugging
        console.log(`TASK DETAIL DUMP for ${task.id}:`, JSON.stringify(task, null, 2));
        
        const taskDate = parseISO(task.date!);
        
        // Skip tasks that aren't today or in the future
        if (!isToday(taskDate) && !isFuture(taskDate)) {
          console.log(`   - Task ${task.id}: Skipping, not today or in future. Date: ${taskDate.toISOString()}`);
          continue;
        }
        
        // Parse the task's start time
        const [hours, minutes] = task.start_time!.split(':').map(Number);
        
        // Build full date-time string in user's timezone
        const taskDateString = formatInTimeZone(taskDate, userTimeZone, 'yyyy-MM-dd');
        const taskTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const taskDateTimeString = `${taskDateString}T${taskTimeString}`;
        
        console.log(`   - Task ${task.id}: Raw task date-time string: ${taskDateTimeString}`);
        
        // Convert to a date object in the user's timezone
        const taskDateTime = toZonedTime(new Date(taskDateTimeString), userTimeZone);
        
        // Calculate time until task needs to be notified
        const timeUntilTask = taskDateTime.getTime() - currentTime.getTime();
        const minutesUntilTask = timeUntilTask / (1000 * 60);

        // Enhanced logging
        console.log(`   - Task ${task.id}: Date: ${taskDate.toISOString()}`);
        console.log(`   - Task ${task.id}: Start time: ${task.start_time}`);
        console.log(`   - Task ${task.id}: Task scheduled for: ${taskDateTime.toISOString()}`);
        console.log(`   - Task ${task.id}: Current time: ${currentTime.toISOString()}`);
        console.log(`   - Task ${task.id}: Minutes until task: ${minutesUntilTask.toFixed(2)}`);
        console.log(`   - Task ${task.id}: Reminder time setting: ${task.reminder_time} minute(s)`);

        // INCREASED window size for notification delivery (critical fix)
        const windowSize = 5; // Increased from 3 to 5 minutes for a more generous window
        
        // Special check for "At start time" notifications (reminder_time = 0)
        if (task.reminder_time === 0) {
          // For "at start time", we want to be very close to the start time
          // Check if we're within the notification window in absolute terms
          const isWithinStartTimeWindow = Math.abs(minutesUntilTask) <= windowSize;
          
          console.log(`   - Task ${task.id}: AT START TIME notification check:`);
          console.log(`   - Task ${task.id}: Is within ${windowSize} minute window of exact start time: ${isWithinStartTimeWindow}`);
          console.log(`   - Task ${task.id}: Absolute minutes to start: ${Math.abs(minutesUntilTask)}`);
          
          if (isWithinStartTimeWindow) {
            console.log(`🔔 EXACT START TIME MATCH! Task ${task.id} (${task.title}) needs AT START TIME notification!`);
            await attemptNotification(task, 'reminder', showTaskNotification, notifiedTasks, isMounted);
          } else {
            console.log(`⏳ Task ${task.id}: Not yet time for AT START TIME notification`);
          }
        } else {
          // For advance reminders, check if we're within the window of when we should send notification
          // This is based on the reminder_time value (minutes before task)
          const reminderPoint = task.reminder_time!; // minutes before task
          const timeUntilReminder = minutesUntilTask - reminderPoint;
          const isWithinReminderWindow = Math.abs(timeUntilReminder) <= windowSize;
          
          console.log(`   - Task ${task.id}: ADVANCE reminder check (${reminderPoint} min before):`);
          console.log(`   - Task ${task.id}: Time until reminder point: ${timeUntilReminder.toFixed(2)} minutes`);
          console.log(`   - Task ${task.id}: Is within ${windowSize} minute window of reminder point: ${isWithinReminderWindow}`);
          
          if (isWithinReminderWindow) {
            console.log(`🔔 ADVANCE REMINDER MATCH! Task ${task.id} (${task.title}) needs ADVANCE notification!`);
            await attemptNotification(task, 'reminder', showTaskNotification, notifiedTasks, isMounted);
          } else {
            console.log(`⏳ Task ${task.id}: Not yet time for ADVANCE notification`);
          }
        }
      } catch (error) {
        if (isMounted.current) {
          console.error(`❌ Error processing task ${task.id} notification:`, error);
        }
      }
    }
  }, []);

  // Helper function to attempt notification delivery
  const attemptNotification = async (
    task: Task, 
    type: 'reminder' | 'shared' | 'assignment',
    showTaskNotification: (task: Task, type: 'reminder' | 'shared' | 'assignment') => Promise<boolean>,
    notifiedTasks: React.MutableRefObject<Set<number>>,
    isMounted: React.MutableRefObject<boolean>
  ) => {
    try {
      // Defensive check before sending notification
      if (!task || !task.id) {
        console.error('❌ Invalid task object passed to attemptNotification:', task);
        return;
      }
      
      console.log(`📲 Attempting to send notification for task ${task.id} (${task.title})`);
      
      const notificationSent = await showTaskNotification(task, type);
      
      if (notificationSent && isMounted.current) {
        console.log(`✅ Task ${task.id}: Notification sent successfully!`);
        notifiedTasks.current.add(task.id);
      } else {
        console.error(`❌ Task ${task.id}: Failed to send notification, result was:`, notificationSent);
      }
    } catch (notifyError) {
      console.error(`❌ Task ${task.id}: Error sending notification:`, notifyError);
    }
  };

  return { checkForUpcomingTasks, lastCheckTimeRef };
}
