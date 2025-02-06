
export const showNotification = async (task: any) => {
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
