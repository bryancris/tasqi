
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

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  const options = {
    body: 'This is a test notification from TasqiAI',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: self.location.origin + '/dashboard'
    },
    tag: 'test-notification',
    renotify: true,
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification('TasqiAI Notification', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // If a window client is available, focus it
        for (const client of clientList) {
          if (client.url === self.location.origin + '/dashboard' && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window client is available, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
  );
});
