
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
    return !!(window && 'twinr_push_token_fetch' in window);
  } catch {
    return false;
  }
};

// Detect the current platform
export const detectPlatform = (): PlatformType => {
  if (isTwinrEnvironment()) {
    const userAgent = navigator.userAgent.toLowerCase();
    console.log('[Platform Detection] User agent:', userAgent);
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('ios')) return 'ios';
  }
  return 'web';
};
