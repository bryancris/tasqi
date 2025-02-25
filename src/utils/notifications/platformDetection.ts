
// Simplified platform detection for web-only implementation
export type PlatformType = 'web';

export interface TokenResponse {
  token: string;
  platform: PlatformType;
  source: 'web';
  platformDetails: {
    userAgent: string;
    language: string;
  };
}

// Platform detection is simplified since we're only supporting web
export const detectPlatform = (): PlatformType => 'web';

// Check if the browser supports notifications
export const isNotificationSupported = (): boolean => {
  try {
    return 'Notification' in window;
  } catch (error) {
    console.error('Error checking notification support:', error);
    return false;
  }
};
