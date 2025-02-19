
import { initializeApp, FirebaseOptions, getApp } from 'firebase/app';
import { getMessaging, isSupported, getToken } from 'firebase/messaging';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBdJAQtaj5bMUmJPiGKmH-viT6vPZOITMU",
  authDomain: "tasqi-6101c.firebaseapp.com",
  projectId: "tasqi-6101c",
  storageBucket: "tasqi-6101c.appspot.com",
  messagingSenderId: "369755737068",
  appId: "1:369755737068:web:d423408214cbc339c7cec9"
};

let messagingInstance: any = null;

// Initialize Firebase with static config
export const initializeFirebase = async () => {
  try {
    let firebaseApp;
    
    try {
      firebaseApp = getApp();
      console.log('Firebase already initialized, returning existing instance');
    } catch {
      console.log('Initializing Firebase with config:', { 
        projectId: firebaseConfig.projectId,
        messagingSenderId: firebaseConfig.messagingSenderId
      });
      firebaseApp = initializeApp(firebaseConfig);
    }
    
    return firebaseApp;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

// Initialize Firebase Cloud Messaging
export const initializeMessaging = async () => {
  try {
    if (messagingInstance) {
      console.log('Firebase Messaging already initialized, returning existing instance');
      return messagingInstance;
    }

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

    messagingInstance = getMessaging(app);
    console.log('Firebase Messaging initialized successfully');
    return messagingInstance;
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
    return null;
  }
};
