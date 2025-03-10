
/**
 * Platform detection utilities
 * Provides consistent platform detection across the app
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

// Combined check for iOS PWA
export function isIOSPWA(): boolean {
  return isIOS() && isPWA();
}

// Get global status of sharing interactions
export function getSharingState() {
  return {
    isClosingSharingSheet: !!(window as any).__isClosingSharingSheet,
    sharingSheetCloseTime: (window as any).__sharingSheetCloseTime || 0,
    sharingIndicatorClickTime: (window as any).sharingIndicatorClickTime || 0,
    closingSharingSheet: (window as any).__closingSharingSheet
  };
}

// Set global sharing sheet status
export function markSharingSheetClosing(id: string) {
  (window as any).__closingSharingSheet = id;
  (window as any).__isClosingSharingSheet = true;
  (window as any).__sharingSheetCloseTime = Date.now();
  
  // Auto-clear after longer delay for iOS PWA
  if (isIOSPWA()) {
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        (window as any).__closingSharingSheet = null;
        (window as any).__isClosingSharingSheet = false;
      }
    }, 2000);
  } else {
    // Standard timeout for other platforms
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        (window as any).__closingSharingSheet = null;
        (window as any).__isClosingSharingSheet = false;
      }
    }, 1500);
  }
}
