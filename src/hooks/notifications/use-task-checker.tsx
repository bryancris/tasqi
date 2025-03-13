
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

        // Handle "At start time" (reminderTime = 0) notifications with a WIDER window
        if (task.reminder_time === 0) {
          // Create a 4-minute window around the exact start time (2 minutes before to 2 minutes after)
          // This ensures we don't miss the notification due to timing issues
          if (Math.abs(minutesUntilTask) <= 2) {
            console.log(`🔔 MATCH! Task ${task.id} (${task.title}) is due now (At start time reminder)`);
            console.log(`   - Window criteria: |${minutesUntilTask.toFixed(2)}| <= 2 minutes`);
            
            const notificationSent = await showTaskNotification(task, 'reminder');
            
            if (notificationSent && isMounted.current) {
              console.log('✅ At-start-time notification sent successfully');
              notifiedTasks.current.add(task.id);
            } else {
              console.error('❌ Failed to send at-start-time notification');
            }
          } else {
            console.log(`⏳ Task ${task.id} not due yet for At-start-time notification (${Math.abs(minutesUntilTask).toFixed(2)} min outside window)`);
          }
        } else {
          // For other reminder times, use the window approach
          const reminderWindowStart = task.reminder_time! + 0.5;
          const reminderWindowEnd = task.reminder_time! - 0.5;
          
          if (minutesUntilTask <= reminderWindowStart && 
              minutesUntilTask > reminderWindowEnd) {
            console.log(`🔔 MATCH! Task ${task.id} (${task.title}) is due in ${minutesUntilTask.toFixed(1)} minutes (${task.reminder_time} minute reminder)`);
            console.log(`   - Window criteria: ${reminderWindowEnd} < ${minutesUntilTask.toFixed(2)} <= ${reminderWindowStart}`);
            
            const notificationSent = await showTaskNotification(task, 'reminder');
            
            if (notificationSent && isMounted.current) {
              console.log('✅ Reminder notification sent successfully');
              notifiedTasks.current.add(task.id);
            } else {
              console.error('❌ Failed to send reminder notification');
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
