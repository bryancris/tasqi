
/**
 * Core platform detection utilities
 * Provides basic device and browser detection across the app
 */

// Check if the current device is running iOS
export function isIOS(): boolean {
  try {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
           !(window as any).MSStream;
  } catch (error) {
    console.error('Error checking iOS:', error);
    return false;
  }
}

// Check if the app is running as an installed PWA
export function isPWA(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  } catch (error) {
    console.error('Error checking PWA status:', error);
    return false;
  }
}

// Check if the device is Android
export function isAndroid(): boolean {
  try {
    return /Android/i.test(navigator.userAgent);
  } catch (error) {
    console.error('Error checking Android:', error);
    return false;
  }
}

// Check if we're on a mobile device
export function isMobileDevice(): boolean {
  try {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  } catch (error) {
    console.error('Error checking mobile device:', error);
    return false;
  }
}

// Combined check for iOS PWA
export function isIOSPWA(): boolean {
  return isIOS() && isPWA();
}

// Combined check for Android PWA
export function isAndroidPWA(): boolean {
  return isAndroid() && isPWA();
}

// Reset stuck platform protection states
export function resetProtectionStates(): void {
  console.log("🧹 Resetting all protection states");
  
  // Reset all protection flags
  (window as any).__isClosingSharingSheet = false;
  (window as any).__sharingProtectionActive = false;
  (window as any).__extremeProtectionActive = false;
  (window as any).__activeShields = 0;
  
  // Clean up body classes
  document.body.classList.remove('ios-pwa-sharing-active');
}

// Get platform info for debugging
export function getPlatformInfo(): Record<string, boolean | string> {
  return {
    isIOS: isIOS(),
    isPWA: isPWA(),
    isAndroid: isAndroid(),
    isMobile: isMobileDevice(),
    isIOSPWA: isIOSPWA(),
    isAndroidPWA: isAndroidPWA(),
    userAgent: navigator.userAgent
  };
}
