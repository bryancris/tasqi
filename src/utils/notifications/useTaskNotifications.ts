
import { useEffect, useCallback, useRef, useState } from 'react';
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
    
    const now = new Date();
    
    // Get tasks with reminders enabled
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('reminder_enabled', true)
      .eq('user_id', userId)
      .neq('status', 'completed');

    if (error) {
      console.error('❌ Error fetching tasks:', error);
      throw error;
    }

    if (!tasks?.length) {
      console.log('ℹ️ No tasks found with reminders enabled');
      return;
    }

    console.log('📋 Found tasks with reminders:', tasks);

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
      
      // Calculate notification window (5 minutes before the task)
      const notificationTime = addMinutes(taskDateTime, -5);
      
      // Notify if we're within the 5-minute window before the task
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
  const initializationAttemptedRef = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);
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
      // Prevent multiple initialization attempts
      if (initializationAttemptedRef.current || isInitializing) {
        return;
      }

      try {
        setIsInitializing(true);
        initializationAttemptedRef.current = true;

        if (!('serviceWorker' in navigator)) {
          console.log('Service Worker is not supported');
          return;
        }

        if (!session?.user?.id) {
          console.log('No user session, skipping notification setup');
          return;
        }

        // Check and request notification permission
        const permissionGranted = await checkNotificationPermission();
        if (!permissionGranted) {
          console.log('Notification permission not granted');
          return;
        }

        // Register service worker
        console.log('📱 Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        // Set up push subscription with a timeout
        const setupPromise = Promise.race([
          setupPushSubscription(registration),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Push subscription setup timed out')), 10000)
          )
        ]);

        await setupPromise;
        
        // Start checking for tasks
        startNotificationCheck();

        console.log('✅ Notifications initialized successfully');
      } catch (error) {
        console.error('Error initializing notifications:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    // Initialize notifications when user session is available
    if (session?.user?.id && !initializationAttemptedRef.current) {
      void initializeNotifications();
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [session?.user?.id, startNotificationCheck]);
};
