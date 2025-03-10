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
    closingSharingSheet: (window as any).__closingSharingSheet,
    sharingProtectionActive: !!(window as any).__sharingProtectionActive,
    sharingProtectionStartTime: (window as any).__sharingProtectionStartTime || 0
  };
}

// Set global sharing sheet status with enhanced protection for iOS PWA
export function markSharingSheetClosing(id: string) {
  (window as any).__closingSharingSheet = id;
  (window as any).__isClosingSharingSheet = true;
  (window as any).__sharingSheetCloseTime = Date.now();
  (window as any).__sharingProtectionActive = true;
  (window as any).__sharingProtectionStartTime = Date.now();
  
  // Log for debugging
  console.log(`🛡️ Marked sharing sheet ${id} as closing with protection`);
  
  // Auto-clear after shorter delay for iOS PWA - reduced from previous values
  if (isIOSPWA()) {
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        console.log(`🛡️ Clearing sharing sheet ${id} close state (iOS PWA)`);
        (window as any).__closingSharingSheet = null;
        (window as any).__isClosingSharingSheet = false;
        // Keep protection active for shorter time
        setTimeout(() => {
          console.log(`🛡️ Clearing sharing protection active state (iOS PWA)`);
          (window as any).__sharingProtectionActive = false;
        }, 500); // Reduced from 1000ms to 500ms
      }
    }, 1500); // Reduced from 3000ms to 1500ms
  } else {
    // Standard timeout for other platforms
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        console.log(`🛡️ Clearing sharing sheet ${id} close state (standard)`);
        (window as any).__closingSharingSheet = null;
        (window as any).__isClosingSharingSheet = false;
        (window as any).__sharingProtectionActive = false;
      }
    }, 800); // Reduced from 1500ms
  }
}

// New function for shield overlay - modifications to be less aggressive
export function addShieldOverlay(duration: number = 1500) {
  // Create a shield element that blocks all interactions
  const shield = document.createElement('div');
  shield.id = 'ios-pwa-shield-' + Date.now();
  shield.style.position = 'fixed';
  shield.style.top = '0';
  shield.style.left = '0';
  shield.style.right = '0';
  shield.style.bottom = '0';
  shield.style.zIndex = '9999'; // Extreme z-index
  shield.style.backgroundColor = 'transparent';
  shield.style.touchAction = 'none';
  shield.setAttribute('data-sharing-shield', 'true');
  
  // Add to body
  document.body.appendChild(shield);
  
  console.log(`🛡️ Added shield overlay with duration ${duration}ms`);
  
  // Event listeners only for essential events
  const blockEvent = (e: Event) => {
    // Only block clicks/touches on task cards, not on UI controls
    if (e.target instanceof Element) {
      // Check if this is a task card or sharing element
      const isTaskCard = e.target.closest('.task-card') || 
                    e.target.closest('[data-task-card]');
      
      // If it's a task card, block the event
      if (isTaskCard) {
        e.preventDefault();
        e.stopPropagation();
        console.log(`🛡️ Shield blocked event: ${e.type} on task card`);
        return false;
      }
      
      // Otherwise, let the event through
      return true;
    }
    return true;
  };
  
  // Only block these essential events
  shield.addEventListener('touchstart', blockEvent, { capture: true, passive: false });
  shield.addEventListener('touchend', blockEvent, { capture: true, passive: false });
  shield.addEventListener('click', blockEvent, { capture: true });
  
  // Remove after shorter duration
  setTimeout(() => {
    if (document.body.contains(shield)) {
      document.body.removeChild(shield);
      console.log(`🛡️ Removed shield overlay after ${duration}ms`);
    }
  }, duration);
  
  // Return a function to manually remove the shield
  return () => {
    if (document.body.contains(shield)) {
      document.body.removeChild(shield);
      console.log(`🛡️ Manually removed shield overlay`);
    }
  };
}
