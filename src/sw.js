
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
  self.skipWaiting(); // Skip waiting to activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  // Claim clients immediately so the service worker starts controlling current pages
  event.waitUntil(self.clients.claim());
});

// Handle offline fallbacks more gracefully
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Support for pull-to-refresh
  if (event.request.headers.get('purpose') === 'pull-to-refresh') {
    console.log('Pull-to-refresh detected in service worker');
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Offline' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
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
