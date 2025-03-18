
import { playNotificationSound as playSound } from './audio/index';
import { trackUserInteraction as trackInteraction } from './audio/audioCore';

/**
 * Re-export the audio playback function for backward compatibility
 * @returns Promise<boolean> indicating if sound was successfully played
 */
export const playNotificationSound = async (): Promise<boolean> => {
  try {
    // Call the playSound function and ensure it returns a boolean
    const result = await playSound();
    // Explicitly return a boolean value
    return result === true;
  } catch (error) {
    console.error('Error playing notification sound:', error);
    return false;
  }
};

/**
 * Re-export the trackUserInteraction function for use in notification components
 */
export const trackUserInteraction = trackInteraction;

/**
 * Preloads notification sounds to reduce latency when playing them
 * This helps ensure sounds play promptly when notifications are triggered
 * @returns Promise<boolean> indicating if preloading was successful
 */
export const preloadNotificationSounds = async (): Promise<boolean> => {
  console.log('🔈 Preloading notification sounds...');
  try {
    // Create an Audio object but don't play it
    const audio = new Audio('/notification-sound.mp3');
    
    // Just load the audio file
    audio.preload = 'auto';
    await audio.load();
    
    console.log('🔈 Notification sounds preloaded successfully');
    return true;
  } catch (error) {
    console.error('🔈 Error preloading notification sounds:', error);
    return false;
  }
};
