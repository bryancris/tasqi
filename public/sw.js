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
    Promise.all([
      // Clean up old caches
      caches.keys().then(keys => Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )),
      // Take control of all pages immediately
      self.clients.claim()
    ])
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

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
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
  console.log('📨 Push event received');
  
  if (!event.data) {
    console.log('Direct notification call');
    const title = 'Task Reminder';
    const options = {
      body: 'You have an upcoming task',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true
    };
    
    await self.registration.showNotification(title, options);
    return;
  }

  const data = event.data.json();
  console.log('📦 Push data received:', data);
  
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  await self.registration.showNotification(data.title, options);
});
