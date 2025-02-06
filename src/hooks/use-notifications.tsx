import { useEffect, useCallback, useRef } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useTaskNotifications = () => {
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  const checkAndNotifyUpcomingTasks = useCallback(async () => {
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
        const taskDate = new Date(task.date);
        const taskTime = task.start_time ? task.start_time.split(':') : ['00', '00', '00'];
        const [hours, minutes] = taskTime;
        
        taskDate.setHours(parseInt(hours), parseInt(minutes), 0);
        
        // Check if we're within 15 minutes of the task time
        const timeDiff = taskDate.getTime() - new Date().getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        if (minutesDiff <= 15 && minutesDiff >= -5) {
          console.log('🎯 Within notification window! Sending notification for task:', task.title);
          
          if (!('Notification' in window)) {
            console.error('❌ Notifications not supported');
            continue;
          }

          let permission = Notification.permission;

          if (permission === 'default') {
            permission = await Notification.requestPermission();
          }

          if (permission !== 'granted') {
            console.error('❌ Notification permission not granted');
            continue;
          }

          const registration = await navigator.serviceWorker.ready;
          console.log('✅ Service worker ready, attempting to show notification');

          await registration.showNotification(task.title, {
            body: `Task scheduled for ${task.start_time}`,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `task-${task.id}`,
            renotify: true,
            requireInteraction: true,
            silent: false
          });

          console.log('✅ Notification sent successfully for task:', task.title);
        }
      }
    } catch (error) {
      console.error('Error checking tasks:', error);
    }
  }, []);

  useEffect(() => {
    const registerAndStartNotifications = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service worker registered and activated');
          
          // Initial check
          await checkAndNotifyUpcomingTasks();
          
          // Set up interval for subsequent checks
          checkIntervalRef.current = setInterval(checkAndNotifyUpcomingTasks, 30000);
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      }
    };

    registerAndStartNotifications();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkAndNotifyUpcomingTasks]);
};