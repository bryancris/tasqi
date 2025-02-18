
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

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
    return initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

// Initialize Firebase Cloud Messaging
export const initializeMessaging = async () => {
  try {
    // Check if messaging is supported first
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
