
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// This allows the service worker to control the current page & other open tabs
self.skipWaiting();
clientsClaim();

// Precache assets specified in manifest
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy
registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the Google Fonts webfont files
registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// Cache static assets
registerRoute(
  /\.(js|css|png|jpg|jpeg|svg|gif|ico)$/,
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 1 day
        maxEntries: 50,
      }),
    ],
  })
);

// API routes
registerRoute(
  /^https:\/\/mcwlzrikidzgxexnccju\.supabase\.co\/rest\/v1/,
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 10 * 60, // 10 minutes
        maxEntries: 50,
      }),
    ],
  })
);

// Handle route navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'page-cache',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
