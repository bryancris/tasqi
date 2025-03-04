
/**
 * Sound utilities for playing notification sounds with multiple fallback mechanisms
 * Enhanced for iOS PWA support
 * 
 * This file is a public API facade that re-exports functionality from the audio/ directory
 * to maintain backward compatibility with existing code.
 */

import { playNotificationSound, trackUserInteraction } from './audio/index';

export { playNotificationSound, trackUserInteraction };
