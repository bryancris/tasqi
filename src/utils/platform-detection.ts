
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
  
  // Significantly extended timeouts for iOS PWA
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
        }, 2000); // Extended from 500ms to 2000ms
      }
    }, 3000); // Extended from 1500ms to 3000ms
  } else {
    // Standard timeout for other platforms
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        console.log(`🛡️ Clearing sharing sheet ${id} close state (standard)`);
        (window as any).__closingSharingSheet = null;
        (window as any).__isClosingSharingSheet = false;
        (window as any).__sharingProtectionActive = false;
      }
    }, 1500); // Extended from 800ms
  }
}

// Improved shield overlay - much more aggressive for iOS PWA
export function addShieldOverlay(duration: number = 1500) {
  const isIOSPwaApp = isIOSPWA();
  const actualDuration = isIOSPwaApp ? Math.max(duration, 3000) : duration;
  
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
  
  console.log(`🛡️ Added shield overlay with duration ${actualDuration}ms (iOS PWA: ${isIOSPwaApp})`);
  
  // Event listeners for all events
  const blockEvent = (e: Event) => {
    // Block ALL events on task cards for iOS PWA
    if (isIOSPwaApp) {
      if (e.target instanceof Element) {
        const isTaskCard = e.target.closest('.task-card') || 
                      e.target.closest('[data-task-card]');
        
        if (isTaskCard) {
          console.log(`🛡️ Shield blocked ${e.type} on task card (iOS PWA)`);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    } else {
      // For non-iOS, only block task card interactions 
      if (e.target instanceof Element) {
        const isTaskCard = e.target.closest('.task-card') || 
                      e.target.closest('[data-task-card]');
        
        if (isTaskCard) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }
    return true;
  };
  
  // Block more events for iOS PWA
  shield.addEventListener('touchstart', blockEvent, { capture: true, passive: false });
  shield.addEventListener('touchend', blockEvent, { capture: true, passive: false });
  shield.addEventListener('click', blockEvent, { capture: true });
  
  if (isIOSPwaApp) {
    shield.addEventListener('mousedown', blockEvent, { capture: true });
    shield.addEventListener('mouseup', blockEvent, { capture: true });
    shield.addEventListener('pointerdown', blockEvent, { capture: true });
    shield.addEventListener('pointerup', blockEvent, { capture: true });
  }
  
  // For iOS PWA, also add document-level handlers for maximum protection
  if (isIOSPwaApp) {
    const blockCardEvents = (e: Event) => {
      if (e.target instanceof Element) {
        const isTaskCard = e.target.closest('.task-card') || 
                      e.target.closest('[data-task-card]');
        
        if (isTaskCard) {
          console.log(`🛡️ Document-level blocker: ${e.type} on task card`);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };
    
    // Use both capture and bubble phase for maximum protection
    document.addEventListener('click', blockCardEvents, { capture: true });
    document.addEventListener('touchstart', blockCardEvents, { capture: true, passive: false });
    
    // Remove document handlers after protection period
    setTimeout(() => {
      document.removeEventListener('click', blockCardEvents, { capture: true });
      document.removeEventListener('touchstart', blockCardEvents, { capture: true });
      console.log(`🛡️ Removed document-level blockers after ${actualDuration}ms`);
    }, actualDuration);
  }
  
  // Remove shield after duration
  setTimeout(() => {
    if (document.body.contains(shield)) {
      document.body.removeChild(shield);
      console.log(`🛡️ Removed shield overlay after ${actualDuration}ms`);
    }
  }, actualDuration);
  
  // Return a function to manually remove the shield
  return () => {
    if (document.body.contains(shield)) {
      document.body.removeChild(shield);
      console.log(`🛡️ Manually removed shield overlay`);
    }
  };
}
