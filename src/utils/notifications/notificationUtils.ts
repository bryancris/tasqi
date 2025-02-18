
export const showNotification = async (task: any, type: 'reminder' | 'shared' = 'reminder') => {
  try {
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Worker not supported');
      return;
    }

    let permission = Notification.permission;

    if (permission !== 'granted') {
      console.log('📱 Requesting notification permission...');
      permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.error('❌ Notification permission not granted');
        return;
      }
    }

    console.log('🔔 Notification permission:', permission);

    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready, attempting to show notification');

    const title = type === 'shared' ? 'New Shared Task' : task.title;
    const body = type === 'shared' 
      ? `A task has been shared with you: ${task.title}`
      : `Task due ${task.start_time ? `at ${task.start_time}` : 'today'}`;

    const options = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `task-${task.id}-${type}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      data: {
        url: window.location.origin + '/dashboard',
        taskId: task.id,
        type: type === 'shared' ? 'task_share' : 'task_reminder'
      }
    };

    await registration.showNotification(title, options);
    console.log('✅ Notification sent successfully for task:', task.title);

    // Play notification sound if supported
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      await audio.play();
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }

  } catch (error) {
    console.error('Error showing notification:', error);
    throw error;
  }
};

export const checkNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      console.log('📱 Notification permission result:', permission);
      return permission === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

