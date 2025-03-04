
/**
 * Main notification sound functionality
 * Entry point for audio playback systems with fallbacks for different platforms
 */

import { playIOSPWASound, playHtml5Audio, playWebAudioFallback } from './platformSpecific';
import { isIOS, isPWA } from '../platformDetection';
import { trackUserInteraction } from './audioCore';

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

export { trackUserInteraction };
