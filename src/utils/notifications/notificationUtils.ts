
export const showNotification = async (task: any) => {
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

    // Always request permission if not granted
    if (permission !== 'granted') {
      console.log('📱 Requesting notification permission...');
      permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.error('❌ Notification permission not granted');
        return;
      }
    }

    console.log('🔔 Notification permission:', permission);

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready, attempting to show notification');

    const title = task.title;
    const options = {
      body: `Task due ${task.start_time ? `at ${task.start_time}` : 'today'}`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `task-${task.id}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      data: {
        url: window.location.origin + '/dashboard',
        taskId: task.id
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

// Add a helper function to check and request permissions
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

