
/**
 * Utility functions for playing notification sounds
 */

// Define available sound types
const SOUND_PATHS = {
  notification: '/sounds/notification.mp3',
  reminder: '/sounds/notification.mp3', // Same file for now, could be different
  message: '/sounds/notification.mp3'    // Same file for now, could be different
};

// Cache audio elements to prevent repeated creation
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Plays a notification sound with error handling
 * 
 * @param type Type of sound to play (defaults to 'notification')
 * @returns Promise that resolves when the sound starts playing or rejects if it fails
 */
export async function playNotificationSound(type: keyof typeof SOUND_PATHS = 'notification'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🔊 Playing ${type} sound...`);
      
      // Check if audio is already cached
      let audio = audioCache.get(type);
      
      // If not cached, create a new audio element
      if (!audio) {
        const soundPath = SOUND_PATHS[type];
        audio = new Audio(soundPath);
        audioCache.set(type, audio);
      }
      
      // Reset audio to beginning
      audio.currentTime = 0;
      
      // Add event listeners
      const onPlay = () => {
        console.log(`🔊 ${type} sound started playing`);
        cleanup();
        resolve();
      };
      
      const onError = (error: any) => {
        console.error(`🔊 Error playing ${type} sound:`, error);
        cleanup();
        reject(error);
      };
      
      const cleanup = () => {
        audio?.removeEventListener('play', onPlay);
        audio?.removeEventListener('error', onError);
      };
      
      // Set up event listeners
      audio.addEventListener('play', onPlay);
      audio.addEventListener('error', onError);
      
      // Set volume (slightly lower to avoid being too jarring)
      audio.volume = 0.7;
      
      // Force a play attempt even if sounds were played recently
      const playPromise = audio.play();
      
      // Handle promise rejection (happens in some browsers)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn(`🔊 Play promise rejected for ${type} sound:`, error);
          
          // Retry once with user interaction workaround for browsers with autoplay policies
          setTimeout(() => {
            console.log(`🔊 Retrying ${type} sound...`);
            audio?.play().catch(retryError => {
              console.error(`🔊 Retry failed for ${type} sound:`, retryError);
              onError(retryError);
            });
          }, 100);
        });
      }
    } catch (error) {
      console.error(`🔊 Unexpected error playing ${type} sound:`, error);
      reject(error);
    }
  });
}

/**
 * Preloads all notification sounds for better performance
 */
export function preloadNotificationSounds(): void {
  console.log('🔊 Preloading notification sounds...');
  
  Object.keys(SOUND_PATHS).forEach(soundType => {
    try {
      const type = soundType as keyof typeof SOUND_PATHS;
      const soundPath = SOUND_PATHS[type];
      const audio = new Audio(soundPath);
      
      // Don't actually play, just load
      audio.load();
      
      // Store in cache
      audioCache.set(type, audio);
      
      console.log(`🔊 Preloaded ${type} sound`);
    } catch (error) {
      console.error(`🔊 Error preloading ${soundType} sound:`, error);
    }
  });
}
