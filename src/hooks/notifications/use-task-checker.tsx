
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
    
    console.log(`⏰ Checking ${tasksToCheck.length} tasks for notifications at ${currentTime.toISOString()}`);
    
    for (const task of tasksToCheck) {
      if (!isMounted.current) break;
      
      try {
        const taskDate = parseISO(task.date!);
        
        // Skip tasks that aren't today or in the future
        if (!isToday(taskDate) && !isFuture(taskDate)) {
          continue;
        }
        
        const [hours, minutes] = task.start_time!.split(':').map(Number);
        const taskDateString = formatInTimeZone(taskDate, userTimeZone, 'yyyy-MM-dd');
        const taskTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const taskDateTimeString = `${taskDateString}T${taskTimeString}`;
        
        const taskDateTime = toZonedTime(new Date(taskDateTimeString), userTimeZone);
        const timeUntilTask = taskDateTime.getTime() - currentTime.getTime();
        const minutesUntilTask = timeUntilTask / (1000 * 60);

        // Debug logging for ALL tasks we're checking
        console.log(`📋 Task ${task.id} (${task.title}):`);
        console.log(`   - Reminder time: ${task.reminder_time} minutes`);
        console.log(`   - Date: ${taskDate.toISOString()}`);
        console.log(`   - Start time: ${task.start_time}`);
        console.log(`   - Task scheduled for: ${taskDateTime.toISOString()}`);
        console.log(`   - Current time: ${currentTime.toISOString()}`);
        console.log(`   - Minutes until task: ${minutesUntilTask.toFixed(2)}`);

        // Set target notification time based on reminder_time
        const targetMinutesBeforeTask = task.reminder_time!;
        
        // For "At start time" (0), use a wider window of 2 minutes
        // For advance notices, use smaller window of 0.5 minutes
        const windowSizeMinutes = targetMinutesBeforeTask === 0 ? 2 : 0.5;
        
        // Calculate window boundaries differently for "At start time" vs. advance reminders
        if (targetMinutesBeforeTask === 0) {
          // For "At start time", we want to notify when we're VERY close to the start time
          // (within +/- windowSizeMinutes of the start time)
          if (Math.abs(minutesUntilTask) <= windowSizeMinutes) {
            console.log(`🔔 MATCH! Task ${task.id} (${task.title}) matches "At start time" criteria:`);
            console.log(`   - Using absolute value check: |${minutesUntilTask.toFixed(2)}| <= ${windowSizeMinutes}`);
            console.log(`   - We are ${Math.abs(minutesUntilTask).toFixed(2)} minutes from the exact start time`);
            
            const notificationSent = await showTaskNotification(task, 'reminder');
            
            if (notificationSent && isMounted.current) {
              console.log('✅ At-start-time notification sent successfully');
              notifiedTasks.current.add(task.id);
            } else {
              console.error('❌ Failed to send at-start-time notification');
            }
          }
        } else {
          // For advance reminders, use the traditional window approach
          // We want to notify when we're exactly X minutes before the task (with a small window)
          const upperBound = targetMinutesBeforeTask + windowSizeMinutes;
          const lowerBound = targetMinutesBeforeTask - windowSizeMinutes;
          
          if (minutesUntilTask <= upperBound && minutesUntilTask > lowerBound) {
            console.log(`🔔 MATCH! Task ${task.id} (${task.title}) matches advance reminder criteria:`);
            console.log(`   - Target time point: ${targetMinutesBeforeTask} minutes before task`);
            console.log(`   - Window: ${lowerBound} to ${upperBound} minutes before task`);
            console.log(`   - Current: ${minutesUntilTask.toFixed(2)} minutes until task`);
            
            const notificationSent = await showTaskNotification(task, 'reminder');
            
            if (notificationSent && isMounted.current) {
              console.log('✅ Advance-reminder notification sent successfully');
              notifiedTasks.current.add(task.id);
            } else {
              console.error('❌ Failed to send advance-reminder notification');
            }
          }
        }
      } catch (error) {
        if (isMounted.current) {
          console.error('Error processing task notification:', error);
        }
      }
    }
  }, []);

  return { checkForUpcomingTasks, lastCheckTimeRef };
}
