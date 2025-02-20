
// Platform and token type definitions
export type TokenSource = 'fcm' | 'twinr';
export type PlatformType = 'web' | 'android' | 'ios';

export interface TokenResponse {
  token: string;
  platform: PlatformType;
  source: TokenSource;
  platformDetails?: Record<string, unknown>;
}

// Check if we're running in Twinr's native environment
export const isTwinrEnvironment = (): boolean => {
  try {
    const hasTwinrToken = !!(window && 'twinr_push_token_fetch' in window);
    console.log('[Platform Detection] Twinr environment check:', hasTwinrToken);
    return hasTwinrToken;
  } catch (error) {
    console.error('[Platform Detection] Error checking Twinr environment:', error);
    return false;
  }
};

// Detect the current platform
export const detectPlatform = (): PlatformType => {
  const userAgent = navigator.userAgent.toLowerCase();
  console.log('[Platform Detection] User agent:', userAgent);
  
  if (isTwinrEnvironment()) {
    if (userAgent.includes('android')) {
      console.log('[Platform Detection] Detected Android platform');
      return 'android';
    }
    if (userAgent.includes('ios')) {
      console.log('[Platform Detection] Detected iOS platform');
      return 'ios';
    }
  }
  
  console.log('[Platform Detection] Defaulting to web platform');
  return 'web';
};
