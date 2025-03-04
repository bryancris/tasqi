
/**
 * Core audio utilities for notification sound playback
 */

// Constants for configuration
export const SOUND_FILE_PATH = '/notification-sound.mp3';
export const DEFAULT_VOLUME = 0.7;
export const IOS_VOLUME = 0.9; // Increased from 0.4 to 0.9 for louder iOS notifications
export const AUDIO_TIMEOUT_MS = 2000;
export const AUDIO_CACHE_DURATION = 60000; // Cache audio for 1 minute

// Cache for audio elements to improve iOS performance
let cachedAudio: HTMLAudioElement | null = null;
let audioCreationTime = 0;

/**
 * Types for sound playback status tracking
 */
export type PlaybackStatus = {
  started: boolean;
  completed: boolean;
};

/**
 * Get a cached audio element or create a new one
 */
export function getAudioElement(isIOSDevice: boolean): HTMLAudioElement {
  const now = Date.now();
  
  // If cache is valid, use it
  if (cachedAudio && now - audioCreationTime < AUDIO_CACHE_DURATION) {
    return cachedAudio;
  }
  
  // Create and prepare a new audio element
  const audio = new Audio(SOUND_FILE_PATH);
  audio.preload = 'auto';
  
  // Set volume based on platform
  audio.volume = isIOSDevice ? IOS_VOLUME : DEFAULT_VOLUME;
  
  // For iOS, attempt to prepare the audio
  if (isIOSDevice) {
    try {
      audio.load();
      // On iOS, muted autoplay might be allowed
      audio.muted = true;
      audio.play().catch(() => {
        // Expected to fail, but might help prepare the audio buffer
        audio.pause();
        audio.muted = false;
        audio.currentTime = 0;
      });
    } catch (e) {
      // Ignore preparation errors
    }
  }
  
  // Update cache
  cachedAudio = audio;
  audioCreationTime = now;
  
  return audio;
}

/**
 * Configure audio element event handlers
 */
export function configureAudioEvents(
  audio: HTMLAudioElement, 
  status: PlaybackStatus, 
  resolve: (value: boolean) => void
): void {
  audio.onplay = () => {
    status.started = true;
    console.log('▶️ Audio playback started');
  };
  
  audio.onended = () => {
    status.completed = true;
    console.log('✅ Audio playback completed normally');
    resolve(true);
  };
  
  audio.onerror = (error) => {
    console.warn('⚠️ Audio playback error:', error);
    if (!status.completed) {
      resolve(false);
    }
  };
}

/**
 * Handle the promise returned by audio.play()
 */
export function handlePlayPromise(
  playPromise: Promise<void> | undefined,
  status: PlaybackStatus,
  resolve: (value: boolean) => void
): void {
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        if (!status.completed) {
          console.log('✅ Audio playback started successfully');
          
          // Safety resolution in case onended doesn't fire
          setTimeout(() => {
            if (!status.completed) {
              console.log('⚠️ Resolving sound promise after timeout');
              resolve(true);
            }
          }, AUDIO_TIMEOUT_MS);
        }
      })
      .catch(error => {
        console.warn('⚠️ HTML5 Audio playback failed:', error);
        resolve(false);
      });
  } else {
    console.warn('⚠️ Audio play() returned undefined');
    resolve(false);
  }
}

/**
 * Set a safety timeout to ensure the promise resolves
 */
export function setSafetyTimeout(
  status: PlaybackStatus,
  resolve: (value: boolean) => void
): void {
  setTimeout(() => {
    if (!status.started && !status.completed) {
      console.warn('⚠️ Audio playback timed out without starting');
      resolve(false);
    }
  }, AUDIO_TIMEOUT_MS);
}

/**
 * Track user interaction to help with iOS audio playback
 */
export function trackUserInteraction(): void {
  localStorage.setItem('lastInteractionTime', Date.now().toString());
}
