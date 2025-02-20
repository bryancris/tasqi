
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
  return typeof window !== 'undefined' && 'twinr_push_token_fetch' in window;
};

// Detect the current platform
export const detectPlatform = (): PlatformType => {
  if (isTwinrEnvironment()) {
    // Use Twinr's built-in platform detection
    // This is a placeholder - replace with actual Twinr platform detection
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('ios')) return 'ios';
  }
  return 'web';
};
