
import { initializeApp, FirebaseOptions, getApp } from 'firebase/app';
import { getMessaging, isSupported, getToken } from 'firebase/messaging';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBdJAQtaj5bMUmJPiGKmH-viT6vPZOITMU",
  authDomain: "tasqi-6101c.firebaseapp.com",
  projectId: "tasqi-6101c",
  storageBucket: "tasqi-6101c.firebaseapp.com",
  messagingSenderId: "369755737068",
  appId: "1:369755737068:web:d423408214cbc339c7cec9"
};

// Initialize Firebase with static config
export const initializeFirebase = async () => {
  try {
    console.log('Initializing Firebase with config:', { 
      projectId: firebaseConfig.projectId,
      messagingSenderId: firebaseConfig.messagingSenderId
    });

    // Check if Firebase app is already initialized
    try {
      return getApp();
    } catch {
      return initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

// Initialize Firebase Cloud Messaging
export const initializeMessaging = async () => {
  try {
    // Register service worker first
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
    }

    // Check if messaging is supported
    const isMessagingSupported = await isSupported();
    if (!isMessagingSupported) {
      console.log('Firebase messaging is not supported in this browser');
      return null;
    }

    const app = await initializeFirebase();
    if (!app) {
      throw new Error('Firebase app not initialized');
    }

    const messaging = getMessaging(app);
    console.log('Firebase Messaging initialized successfully');
    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
    return null;
  }
};

// Get FCM token with proper VAPID key
export const getFCMToken = async (messaging: any) => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: "BPYfG5p8YrAG9bsK0YeJ5YrXKcAy9wcm2LhQIHzJODbVW6gJnQUtlOsJA_XPtX4hC46QqLshhkTQ9HJxcOkIZXc",
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
    });

    if (currentToken) {
      console.log('FCM token obtained successfully');
      return currentToken;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};
