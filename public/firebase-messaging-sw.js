
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

console.log('[Firebase SW] Initializing Firebase Messaging SW');

firebase.initializeApp({
  apiKey: "AIzaSyBdJAQtaj5bMUmJPiGKmH-viT6vPZOITMU",
  authDomain: "tasqi-6101c.firebaseapp.com",
  projectId: "tasqi-6101c",
  storageBucket: "tasqi-6101c.appspot.com",
  messagingSenderId: "369755737068",
  appId: "1:369755737068:web:d423408214cbc339c7cec9"
});

const messaging = firebase.messaging();
console.log('[Firebase SW] Messaging instance created');

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Firebase SW] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Task Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `task-notification-${Date.now()}`,
    data: payload.data,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Task'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('install', (event) => {
  console.log('[Firebase SW] Installing Service Worker...', event);
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[Firebase SW] Activating Service Worker...', event);
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Firebase SW] Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then((clientList) => {
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
  }
});
