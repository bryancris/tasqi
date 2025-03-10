
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

// Drastically improved shield overlay with multiple layers for iOS PWA
export function addShieldOverlay(duration: number = 1500) {
  const isIOSPwaApp = isIOSPWA();
  // Much longer duration for iOS PWA
  const actualDuration = isIOSPwaApp ? Math.max(duration, 6000) : duration;
  
  // Track active shields
  (window as any).__activeShields = ((window as any).__activeShields || 0) + 1;
  const shieldId = `ios-pwa-shield-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a shield element that blocks all interactions
  const shield = document.createElement('div');
  shield.id = shieldId;
  shield.style.position = 'fixed';
  shield.style.top = '0';
  shield.style.left = '0';
  shield.style.right = '0';
  shield.style.bottom = '0';
  shield.style.zIndex = '998'; // Below close button
  shield.style.backgroundColor = 'transparent';
  shield.style.touchAction = 'none';
  shield.setAttribute('data-sharing-shield', 'true');
  
  // Add to body
  document.body.appendChild(shield);
  
  console.log(`🛡️ Added shield overlay ${shieldId} with duration ${actualDuration}ms (iOS PWA: ${isIOSPwaApp})`);
  
  // Event listeners for all events with specific task card blocking
  const blockEvent = (e: Event) => {
    // For iOS PWA, block ALL task card interactions with maximum protection
    if (isIOSPwaApp) {
      if (e.target instanceof Element) {
        // Identify task cards with multiple selectors to be thorough
        const isTaskCard = e.target.closest('.task-card') || 
                      e.target.closest('[data-task-card]') ||
                      e.target.closest('[role="button"]') ||
                      (e.target.getAttribute && e.target.getAttribute('data-task-card') === 'true');
        
        // Allow close button and controls
        const isControl = e.target.closest('[data-sheet-close]') ||
                     e.target.closest('button') ||
                     e.target.closest('[data-radix-dialog-close]');
        
        if (isTaskCard && !isControl) {
          console.log(`🛡️ Shield ${shieldId} blocked ${e.type} on task card (iOS PWA)`);
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
  
  // Block far more events for iOS PWA with capture phase
  shield.addEventListener('touchstart', blockEvent, { capture: true, passive: false });
  shield.addEventListener('touchend', blockEvent, { capture: true, passive: false });
  shield.addEventListener('touchmove', blockEvent, { capture: true, passive: false });
  shield.addEventListener('click', blockEvent, { capture: true });
  
  if (isIOSPwaApp) {
    shield.addEventListener('mousedown', blockEvent, { capture: true });
    shield.addEventListener('mouseup', blockEvent, { capture: true });
    shield.addEventListener('pointerdown', blockEvent, { capture: true });
    shield.addEventListener('pointerup', blockEvent, { capture: true });
    shield.addEventListener('pointermove', blockEvent, { capture: true, passive: false });
  }
  
  // For iOS PWA, add much more aggressive document-level handlers
  if (isIOSPwaApp) {
    const blockCardEvents = (e: Event) => {
      if (e.target instanceof Element) {
        // More comprehensive task card detection
        const isTaskCard = e.target.closest('.task-card') || 
                      e.target.closest('[data-task-card]') ||
                      e.target.closest('[role="button"]') ||
                      (e.target.getAttribute && e.target.getAttribute('data-task-card') === 'true');
        
        // Exclude sharing indicators and controls
        const isSharingControl = e.target.closest('[data-sharing-indicator]') ||
                          e.target.closest('.sharing-indicator') ||
                          e.target.closest('[data-radix-dialog-close]') ||
                          e.target.closest('button') ||
                          e.target.closest('[data-sheet-close]');
        
        if (isTaskCard && !isSharingControl) {
          console.log(`🛡️ Document-level blocker: ${e.type} on task card through shield ${shieldId}`);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };
    
    // Use both capture and bubble phase for maximum protection
    document.addEventListener('click', blockCardEvents, { capture: true });
    document.addEventListener('touchstart', blockCardEvents, { capture: true, passive: false });
    document.addEventListener('touchend', blockCardEvents, { capture: true, passive: false });
    
    // Set extreme protection flags
    (window as any).__extremeProtectionActive = true;
    (window as any).__extremeProtectionStartTime = Date.now();
    
    // Remove document handlers after protection period in multiple phases
    setTimeout(() => {
      document.removeEventListener('touchstart', blockCardEvents, { capture: true });
      console.log(`🛡️ Removed first layer document-level blockers after ${actualDuration/2}ms`);
    }, actualDuration/2);
    
    setTimeout(() => {
      document.removeEventListener('click', blockCardEvents, { capture: true });
      document.removeEventListener('touchend', blockCardEvents, { capture: true });
      console.log(`🛡️ Removed second layer document-level blockers after ${actualDuration}ms`);
      
      // Only clear extreme protection if this was the last shield
      if (((window as any).__activeShields || 0) <= 1) {
        (window as any).__extremeProtectionActive = false;
      }
    }, actualDuration);
  }
  
  // Remove shield after duration
  setTimeout(() => {
    if (document.body.contains(shield)) {
      document.body.removeChild(shield);
      // Decrease active shields count
      (window as any).__activeShields = Math.max(0, ((window as any).__activeShields || 0) - 1);
      console.log(`🛡️ Removed shield overlay ${shieldId} after ${actualDuration}ms. Active shields: ${(window as any).__activeShields}`);
    }
  }, actualDuration);
  
  // Return a function to manually remove the shield
  return () => {
    if (document.body.contains(shield)) {
      document.body.removeChild(shield);
      // Decrease active shields count
      (window as any).__activeShields = Math.max(0, ((window as any).__activeShields || 0) - 1);
      console.log(`🛡️ Manually removed shield overlay ${shieldId}. Active shields: ${(window as any).__activeShields}`);
    }
  };
}
