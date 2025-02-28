
// Platform detection for web and iOS PWA implementation
export type PlatformType = 'web' | 'ios-pwa';

export interface TokenResponse {
  token: string;
  platform: PlatformType;
  source: 'web';
  platformDetails: {
    userAgent: string;
    language: string;
    isStandalone?: boolean;
    isIOS?: boolean;
  };
}

// Enhanced platform detection to identify iOS PWA installations
export const detectPlatform = (): PlatformType => {
  try {
    // Detect iOS devices (iPhone, iPad, iPod)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                 !(window as any).MSStream;
    
    // Check if running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    // Log detection results for debugging
    console.log('📱 Platform detection:', { 
      isIOS, 
      isStandalone,
      userAgent: navigator.userAgent 
    });
    
    // Return the specific platform type
    if (isIOS && isStandalone) {
      return 'ios-pwa';
    }
    
    return 'web';
  } catch (error) {
    console.error('❌ Error in platform detection:', error);
    return 'web'; // Default fallback
  }
};

// Check if the device/browser supports notifications
export const isNotificationSupported = (): boolean => {
  try {
    const platform = detectPlatform();
    
    // Standard web notification support check
    const hasNotificationAPI = 'Notification' in window;
    
    // iOS PWA specific check
    if (platform === 'ios-pwa') {
      // iOS doesn't fully support the Notification API in the same way
      // Instead we check for service worker support which is needed for push
      const hasServiceWorkerSupport = 'serviceWorker' in navigator;
      
      console.log('🍎 iOS PWA notification support check:', { 
        hasNotificationAPI, 
        hasServiceWorkerSupport 
      });
      
      // For iOS, we'll work with what we have and try different approaches
      return true;  // Always return true for iOS and handle limitations in implementation
    }
    
    return hasNotificationAPI;
  } catch (error) {
    console.error('❌ Error checking notification support:', error);
    return false;
  }
};

// Check if the current browser is Safari
export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

// Special function to detect iOS version
export const getIOSVersion = (): number | null => {
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
};
