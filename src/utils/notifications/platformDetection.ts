
// Platform and token type definitions
export type TokenSource = 'fcm' | 'twinr';
export type PlatformType = 'web' | 'android' | 'ios';

export interface TokenResponse {
  token: string;
  platform: PlatformType;
  source: TokenSource;
  platformDetails?: Record<string, unknown>;
}

// Check if we're running in a Capacitor native environment
export const isNativeApp = (): boolean => {
  return typeof (window as any).Capacitor !== 'undefined';
};

// Check if we're running in Twinr's native environment
export const isTwinrEnvironment = (): boolean => {
  return typeof window !== 'undefined' && 'twinr_push_token_fetch' in window;
};

// Detect the current platform
export const detectPlatform = (): PlatformType => {
  if (isNativeApp()) {
    const platform = (window as any).Capacitor.getPlatform();
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
  }
  return 'web';
};
