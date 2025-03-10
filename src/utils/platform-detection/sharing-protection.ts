import { isIOSPWA } from './core';

// Get global status of sharing interactions with more details
export function getSharingState() {
  return {
    isClosingSharingSheet: !!(window as any).__isClosingSharingSheet,
    sharingSheetCloseTime: (window as any).__sharingSheetCloseTime || 0,
    sharingIndicatorClickTime: (window as any).sharingIndicatorClickTime || 0,
    closingSharingSheet: (window as any).__closingSharingSheet,
    sharingProtectionActive: !!(window as any).__sharingProtectionActive,
    sharingProtectionStartTime: (window as any).__sharingProtectionStartTime || 0,
    lastSheetCloseId: (window as any).__lastSheetCloseId || '',
    extremeProtectionActive: !!(window as any).__extremeProtectionActive,
    extremeProtectionStartTime: (window as any).__extremeProtectionStartTime || 0,
    activeShields: (window as any).__activeShields || 0
  };
}

// Set global sharing sheet status with reliable protection
export function markSharingSheetClosing(id: string) {
  const isIOSPwaApp = isIOSPWA();
  const closeId = `${id}-${Date.now()}`;
  
  // Set all global flags with timestamps
  (window as any).__closingSharingSheet = id;
  (window as any).__isClosingSharingSheet = true;
  (window as any).__sharingSheetCloseTime = Date.now();
  (window as any).__sharingProtectionActive = true;
  (window as any).__sharingProtectionStartTime = Date.now();
  (window as any).__lastSheetCloseId = closeId;
  
  // Extreme protection for iOS PWA
  if (isIOSPwaApp) {
    (window as any).__extremeProtectionActive = true;
    (window as any).__extremeProtectionStartTime = Date.now();
  }
  
  console.log(`🛡️ Marked sharing sheet ${id} as closing with protection (iOS PWA: ${isIOSPwaApp})`);
  
  // Set appropriate timeouts based on platform
  const standardDelay = isIOSPwaApp ? 3500 : 2000;
  const protectionDelay = isIOSPwaApp ? 4000 : 2500;
  const extremeDelay = isIOSPwaApp ? 5000 : 3000;
  
  // First layer: Clear sheet close state
  const timeoutOne = setTimeout(() => {
    if ((window as any).__closingSharingSheet === id) {
      console.log(`🛡️ Clearing sharing sheet ${id} close state (Layer 1)`);
      (window as any).__closingSharingSheet = null;
      (window as any).__isClosingSharingSheet = false;
    }
  }, standardDelay);
  
  // Second layer: Keep protection active longer
  const timeoutTwo = setTimeout(() => {
    if ((window as any).__lastSheetCloseId === closeId) {
      console.log(`🛡️ Clearing sharing protection active state (Layer 2)`);
      (window as any).__sharingProtectionActive = false;
    }
  }, protectionDelay);
  
  // Third layer for iOS PWA
  let timeoutThree: ReturnType<typeof setTimeout> | null = null;
  if (isIOSPwaApp) {
    timeoutThree = setTimeout(() => {
      if ((window as any).__lastSheetCloseId === closeId) {
        console.log(`🛡️ Clearing extreme protection (Layer 3)`);
        (window as any).__extremeProtectionActive = false;
      }
    }, extremeDelay);
  }
  
  // Safety fallback to clear ALL protections after a longer time
  const fallbackTimeout = setTimeout(() => {
    console.log(`🛡️ Fallback timeout clearing all protections`);
    (window as any).__closingSharingSheet = null;
    (window as any).__isClosingSharingSheet = false;
    (window as any).__sharingProtectionActive = false;
    (window as any).__extremeProtectionActive = false;
  }, isIOSPwaApp ? 7000 : 5000);
  
  // Return cleanup function
  return () => {
    clearTimeout(timeoutOne);
    clearTimeout(timeoutTwo);
    if (timeoutThree) clearTimeout(timeoutThree);
    clearTimeout(fallbackTimeout);
    
    console.log(`🛡️ Manually cleared sheet timeouts for ${id}`);
    (window as any).__closingSharingSheet = null;
    (window as any).__isClosingSharingSheet = false;
    (window as any).__sharingProtectionActive = false;
    (window as any).__extremeProtectionActive = false;
  };
}

// Clear all protection states (useful for cleanup)
export function clearAllProtectionStates() {
  (window as any).__closingSharingSheet = null;
  (window as any).__isClosingSharingSheet = false;
  (window as any).__sharingProtectionActive = false;
  (window as any).__extremeProtectionActive = false;
  (window as any).__activeShields = 0;
  
  console.log("🧹 Cleared all sharing protection states");
}
