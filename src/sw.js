
/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

// Enable immediate claiming of clients
clientsClaim();

// Precache all assets generated by your build process
precacheAndRoute(self.__WB_MANIFEST);

// Cache the API requests
registerRoute(
  /^https:\/\/mcwlzrikidzgxexnccju\.supabase\.co/,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 1 day
      }),
    ],
  })
);

// Cache static assets
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|woff|woff2|eot|ttf|otf)$/,
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Handle push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options: NotificationOptions = {
      body: data.body || 'New notification',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: data,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'New Task', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // If a window client is available, focus it
      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          return;
        }
      }

      // If no window client is available, open a new window
      if (self.clients.openWindow) {
        await self.clients.openWindow('/dashboard');
      }
    })()
  );
});

// Handle the installation of the service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache the offline page
      caches.open('offline-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/offline.html',
          '/pwa-192x192.png',
          '/pwa-512x512.png'
        ]);
      }),
      // Skip waiting to activate the new service worker immediately
      self.skipWaiting()
    ])
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open('notification-cache');
          const requests = await cache.keys();
          
          for (const request of requests) {
            try {
              const response = await fetch(request);
              if (response.ok) {
                await cache.delete(request);
              }
            } catch (error) {
              console.error('Error syncing notification:', error);
            }
          }
        } catch (error) {
          console.error('Error in sync event:', error);
        }
      })()
    );
  }
});

// Handle periodic background sync for notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(
      (async () => {
        try {
          const response = await fetch('/api/notifications/check');
          if (response.ok) {
            const notifications = await response.json();
            for (const notification of notifications) {
              await self.registration.showNotification(
                notification.title,
                notification.options
              );
            }
          }
        } catch (error) {
          console.error('Error checking notifications:', error);
        }
      })()
    );
  }
});
