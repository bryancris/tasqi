import { useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { showNotification, checkNotificationPermission } from './notificationUtils';
import { setupPushSubscription } from './subscriptionUtils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, addMinutes, isBefore, isAfter } from 'date-fns';

// Keep track of notified tasks
const notifiedTasks = new Set<number>();

export const checkAndNotifyUpcomingTasks = async (userId: string) => {
  try {
    console.log('🔍 Checking upcoming tasks for user:', userId);
    
    // Get tasks for next 24 hours with reminders enabled
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('reminder_enabled', true)
      .eq('status', 'scheduled')
      .eq('user_id', userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching tasks:', error);
      throw error;
    }

    if (!tasks?.length) {
      console.log('ℹ️ No upcoming tasks found with reminders enabled');
      return;
    }

    console.log('📋 Found', tasks.length, 'upcoming tasks with reminders enabled');

    const now = new Date();
    for (const task of tasks) {
      if (notifiedTasks.has(task.id)) {
        console.log('⏭️ Already notified about task:', task.id);
        continue;
      }

      if (!task.date || !task.start_time) {
        console.log('⚠️ Task missing date or start time:', task.id);
        continue;
      }

      // Combine date and time into a single Date object
      const taskDateTime = parseISO(`${task.date}T${task.start_time}`);
      
      // Calculate notification window (1 minute before the task)
      const notificationTime = addMinutes(taskDateTime, -1);
      
      console.log('Task timing check:', {
        taskId: task.id,
        taskTitle: task.title,
        taskDateTime: taskDateTime.toISOString(),
        notificationTime: notificationTime.toISOString(),
        currentTime: now.toISOString(),
        shouldNotify: isAfter(now, notificationTime) && isBefore(now, taskDateTime)
      });

      // Notify if we're within the 1-minute window before the task
      if (isAfter(now, notificationTime) && isBefore(now, taskDateTime)) {
        console.log('🔔 Sending notification for task:', task.title);
        await showNotification(task);
        notifiedTasks.add(task.id);
      }
    }
  } catch (error) {
    console.error('Error in checkAndNotifyUpcomingTasks:', error);
  }
};

export const useTaskNotifications = () => {
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const { session } = useAuth();

  const startNotificationCheck = useCallback(() => {
    if (!session?.user?.id) {
      console.log('No user session, skipping notification check');
      return;
    }

    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Do an initial check
    void checkAndNotifyUpcomingTasks(session.user.id);

    // Set up periodic checks
    checkIntervalRef.current = setInterval(() => {
      void checkAndNotifyUpcomingTasks(session.user.id);
    }, 30000); // Check every 30 seconds
  }, [session?.user?.id]);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (!('serviceWorker' in navigator)) {
          toast.error('Service Worker is not supported in this browser');
          return;
        }

        if (!session?.user?.id) {
          console.log('No user session, skipping notification setup');
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

        toast.success('Task notifications enabled successfully');
      } catch (error) {
        console.error('Error initializing notifications:', error);
        toast.error('Failed to initialize notifications');
      }
    };

    // Initialize notifications when user session is available
    if (session?.user?.id) {
      initializeNotifications();
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [session?.user?.id, startNotificationCheck]);
};
