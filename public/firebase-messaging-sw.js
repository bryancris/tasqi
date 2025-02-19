
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBdJAQtaj5bMUmJPiGKmH-viT6vPZOITMU",
  authDomain: "tasqi-6101c.firebaseapp.com",
  projectId: "tasqi-6101c",
  storageBucket: "tasqi-6101c.appspot.com",
  messagingSenderId: "369755737068",
  appId: "1:369755737068:web:d423408214cbc339c7cec9"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
