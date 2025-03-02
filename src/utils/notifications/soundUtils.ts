
/**
 * Sound utilities for playing notification sounds with multiple fallback mechanisms
 */

// Constants for configuration
const SOUND_FILE_PATH = '/notification-sound.mp3';
const DEFAULT_VOLUME = 0.7;
const AUDIO_TIMEOUT_MS = 2000;

/**
 * Types for sound playback status tracking
 */
type PlaybackStatus = {
  started: boolean;
  completed: boolean;
};

/**
 * Main function to play notification sounds with fallbacks
 * Returns a promise that resolves to true if sound was played successfully
 */
export async function playNotificationSound(): Promise<boolean> {
  console.log('🎵 Playing notification sound...');
  
  try {
    // Try HTML5 Audio playback first
    const audioResult = await playHtml5Audio();
    if (audioResult) {
      return true;
    }
    
    // If HTML5 Audio fails, try Web Audio API as fallback
    console.log('⚠️ Falling back to Web Audio API');
    const webAudioResult = await playWebAudioFallback();
    return webAudioResult;
  } catch (error) {
    console.error('❌ All sound playback methods failed:', error);
    return false;
  }
}

/**
 * Play sound using HTML5 Audio API
 */
async function playHtml5Audio(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      // Create and configure audio element
      const audio = new Audio(SOUND_FILE_PATH);
      audio.volume = DEFAULT_VOLUME;
      audio.preload = 'auto';
      
      // Track playback status
      const status: PlaybackStatus = {
        started: false,
        completed: false
      };
      
      // Set up event handlers
      configureAudioEvents(audio, status, resolve);
      
      // Attempt to play the audio
      const playPromise = audio.play();
      handlePlayPromise(playPromise, status, resolve);
      
      // Safety timeout in case all events fail
      setSafetyTimeout(status, resolve);
    } catch (error) {
      console.warn('⚠️ HTML5 Audio setup failed:', error);
      resolve(false);
    }
  });
}

/**
 * Configure audio element event handlers
 */
function configureAudioEvents(
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
function handlePlayPromise(
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
function setSafetyTimeout(
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
 * Play a simple tone using Web Audio API as fallback
 */
async function playWebAudioFallback(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContext) {
        console.error('❌ Web Audio API not available in this browser');
        resolve(false);
        return;
      }
      
      // Create audio context and nodes
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configure oscillator
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      
      // Configure gain (volume and fade-out)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play tone
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('✅ Web Audio API fallback sound played');
      
      // Add a small delay before resolving to ensure sound is heard
      setTimeout(() => resolve(true), 600);
    } catch (error) {
      console.error('❌ Web Audio API fallback failed:', error);
      resolve(false);
    }
  });
}
