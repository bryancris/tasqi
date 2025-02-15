
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
    throw new Error('Firebase configuration not found in app settings');
  }

  // Type assertion to ensure the config matches FirebaseOptions
  const config = data.firebase_config as FirebaseOptions;

  // Validate required fields
  if (!config.apiKey || !config.projectId || !config.messagingSenderId) {
    throw new Error('Invalid Firebase configuration: missing required fields');
  }

  return config;
};

// Initialize Firebase with async config
export const initializeFirebase = async () => {
  try {
    const firebaseConfig = await getFirebaseConfig();
    return initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

// Initialize Firebase Cloud Messaging
export const initializeMessaging = async () => {
  try {
    const app = await initializeFirebase();
    if (!app) {
      throw new Error('Firebase app not initialized');
    }

    if (await isSupported()) {
      const messaging = getMessaging(app);
      return messaging;
    }
    console.log('Firebase messaging is not supported in this browser');
    return null;
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
    return null;
  }
};
