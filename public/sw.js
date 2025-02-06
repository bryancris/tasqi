
const CACHE_NAME = 'lovable-pwa-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/notification-sound.mp3',
  '/pwa-192x192.png',
  '/dashboard',
  '/dashboard/weekly'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // Immediately activate the service worker
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Take control of all pages immediately
    clients.claim()
  );
});

self.addEventListener('fetch', event => {
  // Handle navigation requests specially
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event);
  event.notification.close();

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // If no window client is available, open a new window
        return clients.openWindow('/dashboard');
      })
  );
});

// Play sound when showing notification
async function playNotificationSound() {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

// Handle showing notifications
self.addEventListener('push', async event => {
  console.log('📨 Push event received:', event);
  
  try {
    let title, body;
    
    // Handle both direct registration.showNotification calls and push events
    if (event.data) {
      const data = event.data.json();
      console.log('📦 Push data:', data);
      title = data.title;
      body = data.body;
    } else {
      title = 'Task Notification';
      body = 'Task reminder';
    }

    const options = {
      body: body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: self.location.origin + '/dashboard'
      },
      tag: 'task-notification',
      renotify: true,
      requireInteraction: true,
      silent: false
    };

    await playNotificationSound();
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling notification:', error);
  }
});
