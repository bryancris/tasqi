
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);

// Setting up background sync for failed API requests with better retry options
const bgSyncPlugin = new BackgroundSyncPlugin('apiQueue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes)
  onSync: async ({queue}) => {
    try {
      // Process all requests in the queue
      await queue.process();
      console.log('Background sync processed successfully');
      // Notify clients about successful sync
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC_COMPLETED',
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }
});

// Google Fonts stylesheets - using StaleWhileRevalidate for better performance
registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Google Fonts webfonts - using CacheFirst with long expiration
registerRoute(
  ({url}) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
        purgeOnQuotaError: true // Automatically purge if storage is full
      }),
    ],
  })
);

// API calls strategy - using NetworkFirst with improved fallback
registerRoute(
  ({url}) => url.origin === 'https://mcwlzrikidzgxexnccju.supabase.co',
  new NetworkFirst({
    cacheName: 'api-responses',
    networkTimeoutSeconds: 10, // Timeout if network takes too long
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, // Increased from 50 to store more API responses
        maxAgeSeconds: 10 * 60, // 10 minutes, increased from 5 for better offline experience
        purgeOnQuotaError: true
      }),
      bgSyncPlugin
    ],
  })
);

// Static assets - scripts and styles
registerRoute(
  ({request}) => request.destination === 'script' || 
                 request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60, // Increased to cache more resources
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        purgeOnQuotaError: true
      })
    ]
  })
);

// Images with improved caching
registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, // Increased from 60
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        purgeOnQuotaError: true
      }),
    ],
  })
);

// Handle installation and activation
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  // Claim clients immediately so the service worker starts controlling current pages
  event.waitUntil(self.clients.claim());
});

// Use a more reliable broadcast channel implementation
let broadcastChannel;
try {
  broadcastChannel = new BroadcastChannel('sw-updates');
} catch (error) {
  console.error('BroadcastChannel not supported:', error);
  // Fallback for browsers not supporting BroadcastChannel
  broadcastChannel = {
    postMessage: (data) => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(data));
      });
    }
  };
}

// Message handling for update/refresh
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting().then(() => {
      console.log('Skip waiting successfully called');
    });
  }
});

// Send notification when service worker takes control
self.addEventListener('controllerchange', () => {
  console.log('Controller changed, notifying clients');
  broadcastChannel.postMessage({ 
    type: 'ACTIVATED',
    timestamp: new Date().toISOString()
  });
});

// Handle offline fallbacks more gracefully
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Only handle navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline and not in cache, show offline page
        return caches.match('/offline.html') || caches.match('/');
      })
    );
  }
});
