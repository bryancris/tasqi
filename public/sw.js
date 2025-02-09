
// Cache name
const CACHE_NAME = 'tasqi-cache-v1';

// Assets to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/notification-sound.mp3',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(urlsToCache);
      })
      .then(() => console.log('Service Worker: All Files Cached'))
      .catch(error => console.error('Service Worker: Cache Failed', error))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('Service Worker: Clearing Old Cache');
              return caches.delete(cache);
            }
          })
        );
      })
  );
  
  // Claim clients immediately
  self.clients.claim();
});

// Push event handler
self.addEventListener('push', event => {
  console.log('Push message received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.body || 'New notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      renotify: true,
      requireInteraction: true,
      data: {
        url: self.registration.scope,
        type: data.type // Add type to handle different notification types
      }
    };
    
    event.waitUntil(
      Promise.all([
        self.registration.showNotification(data.title || 'New Task', options),
        // Play notification sound
        new Audio('/notification-sound.mp3').play()
      ]).catch(error => console.error('Error showing notification:', error))
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle different notification types
  const notificationData = event.notification.data;
  let targetUrl = '/dashboard';
  
  if (notificationData?.type === 'task_share') {
    targetUrl = '/dashboard'; // Could be a specific view for shared tasks
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow(targetUrl);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip caching for DELETE requests
  if (event.request.method === 'DELETE') {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch new
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Only cache GET requests
            if (event.request.method === 'GET') {
              return caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, fetchResponse.clone());
                  return fetchResponse;
                });
            }
            return fetchResponse;
          });
      })
  );
});
