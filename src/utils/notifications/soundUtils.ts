
import { playNotificationSound as playSound } from './audio/index';
import { trackUserInteraction as trackInteraction } from './audio/audioCore';

/**
 * Re-export the audio playback function for backward compatibility
 * @returns Promise<boolean> indicating if sound was successfully played
 */
export const playNotificationSound = playSound;

/**
 * Re-export the trackUserInteraction function for use in notification components
 */
export const trackUserInteraction = trackInteraction;
