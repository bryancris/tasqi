
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
      task.start_time &&
      (isToday(parseISO(task.date)) || isFuture(parseISO(task.date)))
    );
    
    for (const task of tasksToCheck) {
      if (!isMounted.current) break;
      
      try {
        const taskDate = parseISO(task.date!);
        
        const [hours, minutes] = task.start_time!.split(':').map(Number);
        const taskDateString = formatInTimeZone(taskDate, userTimeZone, 'yyyy-MM-dd');
        const taskTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        const taskDateTimeString = `${taskDateString}T${taskTimeString}`;
        
        const taskDateTime = toZonedTime(new Date(taskDateTimeString), userTimeZone);
        const timeUntilTask = taskDateTime.getTime() - currentTime.getTime();
        const minutesUntilTask = timeUntilTask / (1000 * 60);

        const reminderWindowStart = task.reminder_time! + 0.5;
        const reminderWindowEnd = task.reminder_time! - 0.5;
        
        if (minutesUntilTask <= reminderWindowStart && 
            minutesUntilTask > reminderWindowEnd) {
          const notificationSent = await showTaskNotification(task, 'reminder');
          
          if (notificationSent && isMounted.current) {
            console.log('✅ Reminder notification sent successfully');
            notifiedTasks.current.add(task.id);
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
