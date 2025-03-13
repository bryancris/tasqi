
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
    
    // Only check tasks that need to be checked
    const tasksToCheck = tasks.filter(task => 
      task.reminder_enabled && 
      !notifiedTasks.current.has(task.id) &&
      task.status === 'scheduled' && 
      task.date && 
      task.start_time
    );
    
    console.log(`⏰ Checking ${tasksToCheck.length} tasks for notifications at ${currentTime.toISOString()} (${userTimeZone})`);
    
    for (const task of tasksToCheck) {
      if (!isMounted.current) break;
      
      try {
        // Log task ID for debugging
        console.log(`📋 Processing task ${task.id} (${task.title}):`);
        
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

        // Uniform approach for all notification times
        const targetReminderTime = task.reminder_time!; // minutes before task
        const windowSize = 3; // Use a larger window to prevent missing notifications
        
        // For "At start time" (reminder_time = 0), we need to be very close to the actual start time
        // For advance reminders (reminder_time > 0), we need to be near the notification point
        
        // Calculate the actual target point in minutes from now
        const targetPoint = targetReminderTime === 0 
          ? 0  // For "at start time", target is 0 minutes from start
          : targetReminderTime;  // For advance reminders, target is reminder_time minutes before
        
        // Check if we're within the notification window
        const isTimeToNotify = targetReminderTime === 0
          // For "at start time", check if we're within windowSize minutes of the exact start time (before or after)
          ? Math.abs(minutesUntilTask) <= windowSize
          // For advance reminders, check if we're within windowSize minutes of the reminder point
          : Math.abs(minutesUntilTask - targetReminderTime) <= windowSize;
        
        console.log(`   - Task ${task.id}: Target point: ${targetPoint} minutes`);
        console.log(`   - Task ${task.id}: Window size: ${windowSize} minutes`);
        console.log(`   - Task ${task.id}: Is time to notify: ${isTimeToNotify}`);
        
        if (isTimeToNotify) {
          // We're in the notification window!
          console.log(`🔔 MATCH! Task ${task.id} (${task.title}) matches notification criteria:`);
          console.log(`   - Type: ${targetReminderTime === 0 ? '"At start time"' : 'Advance reminder'}`);
          console.log(`   - Current time: ${new Date().toISOString()}`);
          console.log(`   - Task time: ${taskDateTime.toISOString()}`);
          console.log(`   - Minutes until task: ${minutesUntilTask.toFixed(2)}`);
          console.log(`   - Notification window: ${windowSize} minutes`);
          
          // Special debugging for task 88
          if (task.id === 88) {
            console.log(`🔍 SPECIAL DEBUGGING FOR TASK 88:`);
            console.log(`   - Raw task date: ${task.date}`);
            console.log(`   - Raw task time: ${task.start_time}`);
            console.log(`   - User timezone: ${userTimeZone}`);
            console.log(`   - Task date string: ${taskDateString}`);
            console.log(`   - Task time string: ${taskTimeString}`);
            console.log(`   - Full datetime string: ${taskDateTimeString}`);
            console.log(`   - Parsed task date/time: ${taskDateTime.toString()}`);
            console.log(`   - Current time: ${currentTime.toString()}`);
            console.log(`   - Time diff (ms): ${timeUntilTask}`);
            console.log(`   - Time diff (min): ${minutesUntilTask}`);
          }
          
          try {
            const notificationSent = await showTaskNotification(task, 'reminder');
            
            if (notificationSent && isMounted.current) {
              console.log(`✅ Task ${task.id}: Notification sent successfully!`);
              notifiedTasks.current.add(task.id);
            } else {
              console.error(`❌ Task ${task.id}: Failed to send notification`);
            }
          } catch (notifyError) {
            console.error(`❌ Task ${task.id}: Error sending notification:`, notifyError);
          }
        } else {
          console.log(`⏳ Task ${task.id}: Not yet time to notify`);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error(`❌ Error processing task ${task.id} notification:`, error);
        }
      }
    }
  }, []);

  return { checkForUpcomingTasks, lastCheckTimeRef };
}
