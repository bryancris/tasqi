import { useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { showNotification, checkNotificationPermission } from './notificationUtils';
import { setupPushSubscription } from './subscriptionUtils';
import { toast } from 'sonner';

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
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    checkAndNotifyUpcomingTasks();
    checkIntervalRef.current = setInterval(() => {
      checkAndNotifyUpcomingTasks();
    }, 30000); // Check every 30 seconds
  }, []);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (!('serviceWorker' in navigator)) {
          toast.error('Service Worker is not supported in this browser');
          return;
        }

        // Check and request notification permission
        const permissionGranted = await checkNotificationPermission();
        if (!permissionGranted) {
          toast.error('Please enable notifications to receive task reminders');
          return;
        }

        // Register service worker
        console.log('📱 Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service worker activated:', registration.active?.state);

        // Set up push subscription
        await setupPushSubscription(registration);
        
        // Start checking for tasks
        startNotificationCheck();

        toast.success('Notifications enabled successfully');
      } catch (error) {
        console.error('Error initializing notifications:', error);
        toast.error('Failed to initialize notifications');
      }
    };

    initializeNotifications();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [startNotificationCheck]);
};
