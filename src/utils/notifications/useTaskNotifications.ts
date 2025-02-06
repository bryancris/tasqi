import { useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { showNotification } from './notificationUtils';
import { setupPushSubscription } from './subscriptionUtils';

// Keep track of notified tasks
const notifiedTasks = new Set<number>();

export const checkAndNotifyUpcomingTasks = async () => {
  try {
    // Get tasks for next 24 hours with reminders enabled
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('reminder_enabled', true)
      .eq('status', 'scheduled')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    if (!tasks?.length) {
      return;
    }

    console.log('📋 Found', tasks.length, 'upcoming tasks with reminders enabled');

    for (const task of tasks) {
      if (notifiedTasks.has(task.id)) {
        console.log('⏭️ Already notified about task:', task.id);
        continue;
      }

      const taskDate = new Date(task.date);
      const taskTime = task.start_time ? task.start_time.split(':') : ['00', '00', '00'];
      const [hours, minutes] = taskTime;
      
      taskDate.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const taskDateTime = taskDate.toLocaleString();
      console.log('\n🔍 Checking task:', task.title);
      console.log('📊 Task Details:', {
        taskId: task.id,
        taskTitle: task.title,
        taskDate: task.date,
        taskTime: task.start_time,
        taskDateTime,
        currentTime: new Date().toLocaleString()
      });

      // Check if we're within 1 minute of the task time (allowing for slight delays)
      const timeDiff = taskDate.getTime() - new Date().getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));

      if (minutesDiff <= 1 && minutesDiff >= -1) {
        console.log('🎯 At start time! Sending notification for task:', task.title);
        await showNotification(task);
        notifiedTasks.add(task.id);
      }
    }

    console.log('\n==================== ✅ CHECK COMPLETE ✅ ====================\n');
  } catch (error) {
    console.error('Error checking tasks:', error);
  }
};

export const useTaskNotifications = () => {
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  const startNotificationCheck = useCallback(() => {
    // Clear any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Initial check
    checkAndNotifyUpcomingTasks();

    // Set up interval for subsequent checks
    checkIntervalRef.current = setInterval(() => {
      checkAndNotifyUpcomingTasks();
    }, 30000); // Check every 30 seconds
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      console.log('Registering service worker...');
      navigator.serviceWorker.register('/sw.js')
        .then(async registration => {
          console.log('Service worker registered:', registration);
          await setupPushSubscription(registration);
          startNotificationCheck();
        })
        .catch(error => {
          console.error('Service worker registration failed:', error);
        });
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [startNotificationCheck]);
};
