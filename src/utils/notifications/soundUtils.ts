/**
 * Sound utilities for playing notification sounds with multiple fallback mechanisms
 * Enhanced for iOS PWA support
 */

// Constants for configuration
const SOUND_FILE_PATH = '/notification-sound.mp3';
const DEFAULT_VOLUME = 0.7;
const IOS_VOLUME = 0.4; // Lower volume for iOS to prevent harsh sounds
const AUDIO_TIMEOUT_MS = 2000;
const AUDIO_CACHE_DURATION = 60000; // Cache audio for 1 minute

// Cache for audio elements to improve iOS performance
let cachedAudio: HTMLAudioElement | null = null;
let audioCreationTime = 0;

/**
 * Types for sound playback status tracking
 */
type PlaybackStatus = {
  started: boolean;
  completed: boolean;
};

/**
 * Detect if the current device is iOS
 */
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !(window as any).MSStream;
}

/**
 * Detect if running in standalone mode (PWA installed)
 */
function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
}

/**
 * Get a cached audio element or create a new one
 */
function getAudioElement(): HTMLAudioElement {
  const now = Date.now();
  
  // If cache is valid, use it
  if (cachedAudio && now - audioCreationTime < AUDIO_CACHE_DURATION) {
    return cachedAudio;
  }
  
  // Create and prepare a new audio element
  const audio = new Audio(SOUND_FILE_PATH);
  audio.preload = 'auto';
  
  // Set volume based on platform
  audio.volume = isIOS() ? IOS_VOLUME : DEFAULT_VOLUME;
  
  // For iOS, attempt to prepare the audio
  if (isIOS()) {
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
 * Main function to play notification sounds with fallbacks
 * Returns a promise that resolves to true if sound was played successfully
 */
export async function playNotificationSound(): Promise<boolean> {
  console.log('🎵 Playing notification sound...');
  
  try {
    // For iOS PWA, use a specialized approach
    if (isIOS() && isPWA()) {
      return await playIOSPWASound();
    }
    
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
 * Specialized sound playback for iOS PWA
 */
async function playIOSPWASound(): Promise<boolean> {
  console.log('🍎 Using iOS PWA specific sound playback');
  
  return new Promise<boolean>((resolve) => {
    try {
      // Get the audio element (cached or new)
      const audio = getAudioElement();
      
      // Track last user interaction time
      const lastInteractionTime = Number(localStorage.getItem('lastInteractionTime') || '0');
      const now = Date.now();
      const timeSinceInteraction = now - lastInteractionTime;
      
      console.log(`🍎 Last interaction was ${Math.round(timeSinceInteraction/1000)}s ago`);
      
      // Try multiple approaches for iOS
      
      // Approach 1: Try normal play with low volume
      const playPromise = audio.play();
      
      if (playPromise === undefined) {
        console.log('🍎 iOS returned undefined play promise (older iOS)');
        // For older iOS that doesn't return a promise from play()
        
        // Set a success timeout assuming it might be playing
        setTimeout(() => {
          console.log('🍎 Assuming sound played on older iOS');
          resolve(true);
        }, 500);
        
        return;
      }
      
      // For newer iOS with Promise support
      playPromise
        .then(() => {
          console.log('✅ iOS sound played successfully!');
          resolve(true);
        })
        .catch(iosError => {
          console.warn('⚠️ iOS primary sound method failed:', iosError);
          
          // Approach 2: Try a silent sound first, then the real sound
          try {
            // Create a very short silent audio context sound
            // This sometimes helps "warm up" the audio system on iOS
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const ctx = new AudioContext();
              const oscillator = ctx.createOscillator();
              const gainNode = ctx.createGain();
              gainNode.gain.setValueAtTime(0.01, ctx.currentTime); // Nearly silent
              oscillator.connect(gainNode);
              gainNode.connect(ctx.destination);
              oscillator.start(0);
              oscillator.stop(0.1);
            }
            
            // Reset and try again
            audio.currentTime = 0;
            audio.volume = 0.1; // Even lower volume for retry
            
            audio.play()
              .then(() => {
                console.log('✅ iOS sound played on second attempt!');
                resolve(true);
              })
              .catch(secondError => {
                console.warn('⚠️ iOS second sound attempt failed:', secondError);
                resolve(false);
              });
          } catch (fallbackError) {
            console.warn('⚠️ iOS fallback sound method failed:', fallbackError);
            resolve(false);
          }
        });
    } catch (error) {
      console.error('❌ iOS PWA sound playback error:', error);
      resolve(false);
    }
  });
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

/**
 * Track user interaction to help with iOS audio playback
 * Call this from user interaction events
 */
export function trackUserInteraction(): void {
  localStorage.setItem('lastInteractionTime', Date.now().toString());
}
