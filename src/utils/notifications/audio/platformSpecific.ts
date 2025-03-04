
/**
 * Platform-specific audio implementations
 */

import { PlaybackStatus, configureAudioEvents, getAudioElement, handlePlayPromise, setSafetyTimeout } from './audioCore';
import { createAudioAnalyser } from './audioFormats';
import { isIOS, isPWA } from '../platformDetection';

/**
 * Specialized sound playback for iOS PWA
 */
export async function playIOSPWASound(): Promise<boolean> {
  console.log('🍎 Using iOS PWA specific sound playback');
  
  return new Promise<boolean>((resolve) => {
    try {
      // Get the audio element (cached or new)
      const audio = getAudioElement(true);
      
      // Track last user interaction time
      const lastInteractionTime = Number(localStorage.getItem('lastInteractionTime') || '0');
      const now = Date.now();
      const timeSinceInteraction = now - lastInteractionTime;
      
      console.log(`🍎 Last interaction was ${Math.round(timeSinceInteraction/1000)}s ago`);
      
      // Try multiple approaches for iOS
      
      // Approach 1: Try normal play with configured volume
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
export async function playHtml5Audio(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    try {
      // Create and configure audio element
      const audio = getAudioElement(isIOS());
      
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
 * Play a simple tone using Web Audio API as fallback
 */
export async function playWebAudioFallback(): Promise<boolean> {
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
