
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
 * - Fixed for date-fns-tz v3 compatibility
 * 
 * Example Usage:
 * const { checkForUpcomingTasks } = useTaskChecker();
 * checkForUpcomingTasks(tasks, isMountedRef, notifiedTasksRef, recentlyCreatedTasksRef, showTaskNotification);
 */

import { Task } from '@/components/dashboard/TaskBoard';
import { useCallback, useRef } from 'react';
import { isToday, parseISO, isFuture } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function useTaskChecker() {
  // Add a tracking ref for the last check time to avoid redundant checks
  const lastCheckTimeRef = useRef<number>(0);
  
  const checkForUpcomingTasks = useCallback(async (
    tasks: Task[], 
    isMounted: React.MutableRefObject<boolean>,
    notifiedTasks: React.MutableRefObject<Set<number>>,
    recentlyCreatedTasks: React.MutableRefObject<Map<number, number>>,
    showTaskNotification: (task: Task, type: 'reminder' | 'shared' | 'assignment') => Promise<boolean>
  ) => {
    if (!isMounted.current) return;
    
    // Skip checking if last check was too recent (within last 3 seconds - reduced from 5 to 3)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 3000) {
      return; // Skip this check, it's too soon after the last one
    }
    
    // Update last check time
    lastCheckTimeRef.current = now;
    
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentTime = new Date();
    
    // Log tasks being checked, including recently created status
    console.log(`📋 All tasks (${tasks.length}):`);
    tasks.forEach(task => {
      const isRecent = recentlyCreatedTasks.current.has(task.id);
      console.log(`- Task ${task.id}: ${task.title}, status: ${task.status}, reminder: ${task.reminder_enabled ? 'ON' : 'OFF'}, reminder_time: ${task.reminder_time}, notified: ${notifiedTasks.current.has(task.id)}, recently created: ${isRecent}`);
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
      const isRecent = recentlyCreatedTasks.current.has(task.id);
      console.log(`- Task ${task.id} (${task.title}) passed initial filter: reminder=${task.reminder_enabled}, time=${task.start_time}, date=${task.date}, reminder_time=${task.reminder_time}, recently created: ${isRecent}`);
    });
    
    if (tasksToCheck.length === 0) {
      console.log('👉 No eligible tasks found for notification check');
    }
    
    for (const task of tasksToCheck) {
      if (!isMounted.current) break;
      
      try {
        // Log task ID for debugging
        console.log(`📋 Processing task ${task.id} (${task.title}):`);
        
        // Skip tasks that were recently created to prevent immediate notifications
        if (recentlyCreatedTasks.current.has(task.id)) {
          const creationTime = recentlyCreatedTasks.current.get(task.id) || 0;
          const timeSinceCreation = now - creationTime;
          console.log(`⏳ Task ${task.id} was created ${timeSinceCreation / 1000}s ago - skipping immediate notification`);
          continue;
        }
        
        // CRITICAL FIX: Make sure reminder_time is properly handled, especially 0 values
        // DEBUG: Log reminder_time explicitly for debugging
        console.log(`🔔 Task ${task.id} exact reminder_time value: ${task.reminder_time} (type: ${typeof task.reminder_time})`);
        
        // DEFENSIVE: Ensure reminder_time exists as a number (including explicit 0 check)
        let reminderTime: number;
        if (task.reminder_time === 0 || task.reminder_time === '0') {
          reminderTime = 0;
          console.log(`🔔 Task ${task.id} has "At start time" reminder (0 value)`);
        } else if (task.reminder_time !== undefined) {
          reminderTime = Number(task.reminder_time);
          console.log(`🔔 Task ${task.id} normalized reminder_time: ${reminderTime}`);
        } else {
          reminderTime = 0; // Default to "At start time" if undefined
          console.log(`🔔 Task ${task.id} has undefined reminder_time, defaulting to 0`);
        }
        
        // IMPORTANT: Parse the date safely
        let taskDate;
        try {
          taskDate = parseISO(task.date!);
          console.log(`📅 Task ${task.id}: Date parsed successfully: ${taskDate.toISOString()}`);
        } catch (dateError) {
          console.error(`❌ Task ${task.id}: Error parsing date ${task.date}:`, dateError);
          continue; // Skip this task due to date parsing error
        }
        
        // Skip tasks that aren't today or in the future
        if (!isToday(taskDate) && !isFuture(taskDate)) {
          console.log(`   - Task ${task.id}: Skipping, not today or in future. Date: ${taskDate.toISOString()}`);
          continue;
        }
        
        // Parse the task's start time
        let hours = 0;
        let minutes = 0; 
        try {
          [hours, minutes] = task.start_time!.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) {
            throw new Error(`Invalid time format: ${task.start_time}`);
          }
          console.log(`⏰ Task ${task.id}: Time parsed successfully: ${hours}:${minutes}`);
        } catch (timeError) {
          console.error(`❌ Task ${task.id}: Error parsing time ${task.start_time}:`, timeError);
          continue; // Skip this task due to time parsing error
        }
        
        // Build full date-time string in user's timezone
        const taskDateString = formatInTimeZone(taskDate, userTimeZone, 'yyyy-MM-dd');
        const taskTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const taskDateTimeString = `${taskDateString}T${taskTimeString}`;
        
        console.log(`   - Task ${task.id}: Raw task date-time string: ${taskDateTimeString}`);
        
        // Convert to a date object
        let taskDateTime;
        try {
          // FIXED FOR date-fns-tz V3: Use new method name and direct Date constructor
          taskDateTime = new Date(`${taskDateString}T${taskTimeString}`);
          console.log(`⏰ Task ${task.id}: DateTime created successfully: ${taskDateTime.toISOString()}`);
        } catch (tzError) {
          console.error(`❌ Task ${task.id}: Error creating date:`, tzError);
          
          // Fallback approach
          console.log(`⚠️ Task ${task.id}: Using fallback approach for date-time conversion`);
          const fallbackDate = new Date(taskDate);
          fallbackDate.setHours(hours, minutes, 0, 0);
          taskDateTime = fallbackDate;
          console.log(`⏰ Task ${task.id}: Fallback DateTime: ${taskDateTime.toISOString()}`);
        }
        
        // Calculate time until task needs to be notified (in milliseconds)
        const timeUntilTask = taskDateTime.getTime() - currentTime.getTime();
        const minutesUntilTask = timeUntilTask / (1000 * 60);

        // Enhanced logging
        console.log(`   - Task ${task.id}: Date: ${taskDate.toISOString()}`);
        console.log(`   - Task ${task.id}: Start time: ${task.start_time}`);
        console.log(`   - Task ${task.id}: Task scheduled for: ${taskDateTime.toISOString()}`);
        console.log(`   - Task ${task.id}: Current time: ${currentTime.toISOString()}`);
        console.log(`   - Task ${task.id}: Time until task: ${timeUntilTask}ms (${minutesUntilTask.toFixed(2)} minutes)`);
        console.log(`   - Task ${task.id}: Reminder time setting: ${reminderTime} minute(s)`);

        // INCREASED window size for notification delivery
        const windowSize = 10; // Increased from 8 to 10 minutes for an even more generous window
        
        // CRITICAL FIX: Explicitly check reminder_time for exact === 0 value (at start time)
        // This is crucial because JavaScript treats 0 as falsy, which can cause bugs
        const isAtStartTime = reminderTime === 0;
        console.log(`   - Task ${task.id}: Is 'At start time' notification? ${isAtStartTime ? 'YES' : 'NO'}`);
        
        if (isAtStartTime) {
          // For "at start time", we want to be very close to the start time
          // Check if we're within the notification window in absolute terms
          const minutesToStartTime = Math.abs(minutesUntilTask);
          
          // IMPROVED WINDOW LOGIC: Include both upcoming and slightly overdue tasks
          const isWithinStartTimeWindow = minutesToStartTime <= windowSize;
          
          console.log(`   - Task ${task.id}: AT START TIME notification check:`);
          console.log(`   - Task ${task.id}: Minutes to exact start: ${minutesToStartTime.toFixed(2)}`);
          console.log(`   - Task ${task.id}: Is within ${windowSize} minute window of exact start time: ${isWithinStartTimeWindow}`);
          
          if (isWithinStartTimeWindow) {
            console.log(`🔔 EXACT START TIME MATCH! Task ${task.id} (${task.title}) needs AT START TIME notification!`);
            await attemptNotification(task, 'reminder', showTaskNotification, notifiedTasks, isMounted);
          } else {
            console.log(`⏳ Task ${task.id}: Not yet time for AT START TIME notification`);
          }
        } else {
          // For advance reminders, check if we're within the window of when we should send notification
          // This is based on the reminder_time value (minutes before task)
          const timeUntilReminder = minutesUntilTask - reminderTime;
          
          // IMPROVED WINDOW LOGIC: Focus on the absolute difference to catch both slightly early and late
          const isWithinReminderWindow = Math.abs(timeUntilReminder) <= windowSize;
          
          console.log(`   - Task ${task.id}: ADVANCE reminder check (${reminderTime} min before):`);
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
