
// Disable workbox logging
self.__WB_DISABLE_DEV_LOGS = true;

// This line is required for the build to work - DO NOT REMOVE
self.__WB_MANIFEST;

// Cache name for our app
const CACHE_NAME = 'tasqi-cache-v1';

// Only cache essential static assets
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache minimal assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Immediately claim clients
  return self.clients.claim();
});

// Only handle push notifications, no aggressive caching
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'New Task', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/dashboard');
    })
  );
});
