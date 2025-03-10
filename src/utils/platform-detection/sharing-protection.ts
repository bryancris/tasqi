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

// Set global sharing sheet status with drastically enhanced protection for iOS PWA
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
  
  // Extreme protection specifically for iOS PWA
  if (isIOSPwaApp) {
    (window as any).__extremeProtectionActive = true;
    (window as any).__extremeProtectionStartTime = Date.now();
  }
  
  // Log for debugging
  console.log(`🛡️ Marked sharing sheet ${id} as closing with EXTREME protection (iOS PWA: ${isIOSPwaApp})`);
  
  // MUCH longer timeouts for iOS PWA
  if (isIOSPwaApp) {
    // First layer: Clear sheet close state after a longer delay
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        console.log(`🛡️ Clearing sharing sheet ${id} close state (iOS PWA Layer 1)`);
        (window as any).__closingSharingSheet = null;
        (window as any).__isClosingSharingSheet = false;
      }
    }, 5000); // Extended from 3000ms to 5000ms
    
    // Second layer: Keep protection active longer
    setTimeout(() => {
      if ((window as any).__lastSheetCloseId === closeId) {
        console.log(`🛡️ Clearing sharing protection active state (iOS PWA Layer 2)`);
        (window as any).__sharingProtectionActive = false;
      }
    }, 6000); // Extended from 2000ms to 6000ms
    
    // Third layer: Clear extreme protection after even longer
    setTimeout(() => {
      if ((window as any).__lastSheetCloseId === closeId) {
        console.log(`🛡️ Clearing extreme protection (iOS PWA Layer 3)`);
        (window as any).__extremeProtectionActive = false;
      }
    }, 7000); // Additional final layer
  } else {
    // Standard timeout for other platforms (still increased)
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        console.log(`🛡️ Clearing sharing sheet ${id} close state (standard)`);
        (window as any).__closingSharingSheet = null;
        (window as any).__isClosingSharingSheet = false;
        (window as any).__sharingProtectionActive = false;
      }
    }, 2500); // Extended from 1500ms to 2500ms
  }
}
