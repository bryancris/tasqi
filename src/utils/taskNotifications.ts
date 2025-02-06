
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Keep track of notified tasks
const notifiedTasks = new Set<number>();

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const savePushSubscription = async (subscription: PushSubscription) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('User must be logged in to save push subscription');
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: session.user.id,
      endpoint: subscription.endpoint,
      auth_keys: {
        p256dh: subscription.toJSON().keys?.p256dh,
        auth: subscription.toJSON().keys?.auth
      }
    }, {
      onConflict: 'user_id,endpoint'
    });

  if (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
};

const getVapidPublicKey = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('vapid_public_key')
    .single();

  if (error) {
    console.error('Error fetching VAPID key:', error);
    throw error;
  }

  return data.vapid_public_key;
};

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

      // Check if we're within 15 minutes of the task time
      const timeDiff = taskDate.getTime() - new Date().getTime();
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));

      if (minutesDiff <= 15 && minutesDiff >= -5) {
        console.log('🎯 Within notification window! Sending notification for task:', task.title);
        await showNotification(task);
        notifiedTasks.add(task.id);
      }
    }

    console.log('\n==================== ✅ CHECK COMPLETE ✅ ====================\n');
  } catch (error) {
    console.error('Error checking tasks:', error);
  }
};

const showNotification = async (task: any) => {
  try {
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported');
      return;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.error('❌ Notification permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready, attempting to show notification');

    // Subscribe to push notifications if not already subscribed
    try {
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (!existingSubscription) {
        const vapidPublicKey = await getVapidPublicKey();
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not found in app settings');
        }

        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        };
        
        const subscription = await registration.pushManager.subscribe(subscribeOptions);
        console.log('✅ Push notification subscription created:', subscription);
        
        // Save the subscription to our backend
        await savePushSubscription(subscription);
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to enable push notifications. Please try again.');
    }

    const title = task.title;
    const options = {
      body: `Task scheduled for ${task.start_time}`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `task-${task.id}`,
      renotify: true,
      requireInteraction: true,
      silent: false
    };

    await registration.showNotification(title, options);
    console.log('✅ Notification sent successfully for task:', task.title);

    // Play notification sound
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    await audio.play();

  } catch (error) {
    console.error('Error showing notification:', error);
    throw error;
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
        .then(registration => {
          console.log('Service worker registered:', registration);
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
