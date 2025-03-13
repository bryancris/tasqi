
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

        // Use a consistent approach for all reminder times including "At start time" (0)
        // Calculate the target notification time based on the reminder_time
        let targetMinutesBeforeTask = task.reminder_time!;
        
        // Create a window around the exact notification time to ensure we don't miss it
        // For "At start time" (0), we want to notify when we're very close to the start time
        // For advance notices, we want to notify when we're close to the reminder time
        const windowSizeMinutes = targetMinutesBeforeTask === 0 ? 2 : 0.5;
        
        // Calculate if we're within the notification window
        // If reminder_time = 0 (at start time), then we want to be within windowSize of the start time
        // If reminder_time > 0, we want to be within windowSize of (start time - reminder_time)
        const targetTimePoint = targetMinutesBeforeTask === 0 ? 0 : targetMinutesBeforeTask;
        const upperBound = targetTimePoint + windowSizeMinutes;
        const lowerBound = targetTimePoint - windowSizeMinutes;
                
        // Check if we're in the notification window
        if (minutesUntilTask <= upperBound && minutesUntilTask > lowerBound) {
          console.log(`🔔 MATCH! Task ${task.id} (${task.title}) matches notification criteria:`);
          console.log(`   - Target time point: ${targetTimePoint} minutes before task`);
          console.log(`   - Window: ${lowerBound} to ${upperBound} minutes before task`);
          console.log(`   - Current: ${minutesUntilTask.toFixed(2)} minutes until task`);
          
          const notificationSent = await showTaskNotification(task, 'reminder');
          
          if (notificationSent && isMounted.current) {
            console.log('✅ Notification sent successfully');
            notifiedTasks.current.add(task.id);
          } else {
            console.error('❌ Failed to send notification');
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
