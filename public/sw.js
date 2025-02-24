
// Service Worker for PWA with notification support
const CACHE_NAME = 'tasqi-v1';

// Cache assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
        '/notification-sound.mp3'
      ]);
    })
  );
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Handle fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'tasqi-notification',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification('TASQI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window tab is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/dashboard/tasks');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event.notification);
});

// Play notification sound
async function playNotificationSound() {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}
