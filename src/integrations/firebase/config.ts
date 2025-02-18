
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { supabase } from '../supabase/client';

// Get Firebase config from Supabase app settings
const getFirebaseConfig = async (): Promise<FirebaseOptions> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('firebase_config')
    .maybeSingle();

  if (error) {
    console.error('Error fetching Firebase config:', error);
    throw error;
  }

  if (!data?.firebase_config) {
    console.error('Firebase configuration not found in app settings');
    throw new Error('Firebase configuration not found in app settings. Please add it to the app_settings table.');
  }

  // Type assertion to ensure the config matches FirebaseOptions
  const config = data.firebase_config as FirebaseOptions;

  // Validate required fields
  const requiredFields = ['apiKey', 'projectId', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof FirebaseOptions]);
  
  if (missingFields.length > 0) {
    const errorMsg = `Invalid Firebase configuration: missing required fields: ${missingFields.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return config;
};

// Initialize Firebase with async config
export const initializeFirebase = async () => {
  try {
    const firebaseConfig = await getFirebaseConfig();
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
