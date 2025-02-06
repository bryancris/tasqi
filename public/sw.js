
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
  
  try {
    const showNotification = async (title, body) => {
      console.log('Showing notification:', { title, body });
      
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

      try {
        await playNotificationSound();
        await self.registration.showNotification(title, options);
        console.log('✅ Notification shown successfully');
      } catch (error) {
        console.error('❌ Error showing notification:', error);
        throw error;
      }
    };

    // Handle direct calls from taskNotifications.ts
    if (!event.data) {
      console.log('Direct notification call');
      await showNotification('Task Reminder', 'You have an upcoming task');
      return;
    }

    // Handle push events with data
    const data = event.data.json();
    console.log('📦 Push data received:', data);
    await showNotification(data.title, data.body);
    
  } catch (error) {
    console.error('❌ Error in push event handler:', error);
    throw error; // Re-throw to ensure the error is logged in the console
  }
});
