
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBdJAQtaj5bMUmJPiGKmH-viT6vPZOITMU",
  authDomain: "tasqi-6101c.firebaseapp.com",
  projectId: "tasqi-6101c",
  storageBucket: "tasqi-6101c.appspot.com",
  messagingSenderId: "369755737068",
  appId: "1:369755737068:web:d423408214cbc339c7cec9"
};

console.log('[Service Worker] Initializing Firebase...');
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Received background message:', payload);

  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'task-notification',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.', event);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.', event);
  
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    clients.openWindow(event.notification.data.url);
  } else {
    clients.openWindow('/');
  }
});
