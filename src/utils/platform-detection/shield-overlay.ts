
import { isIOSPWA } from './core';

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
