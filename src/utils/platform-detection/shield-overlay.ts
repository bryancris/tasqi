
import { isIOSPWA } from './core';

// Improved shield overlay with reliable cleanup
export function addShieldOverlay(duration: number = 1500) {
  const isIOSPwaApp = isIOSPWA();
  // Use sensible duration for different platforms
  const actualDuration = isIOSPwaApp ? Math.max(duration, 3000) : duration;
  
  // Track active shields
  (window as any).__activeShields = ((window as any).__activeShields || 0) + 1;
  const shieldId = `shield-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a shield element that blocks interactions
  const shield = document.createElement('div');
  shield.id = shieldId;
  shield.style.position = 'fixed';
  shield.style.top = '0';
  shield.style.left = '0';
  shield.style.right = '0';
  shield.style.bottom = '0';
  shield.style.zIndex = '998';
  shield.style.backgroundColor = 'transparent';
  shield.style.touchAction = 'none';
  shield.setAttribute('data-sharing-shield', 'true');
  
  // Add to body
  document.body.appendChild(shield);
  
  console.log(`🛡️ Added shield overlay ${shieldId} with duration ${actualDuration}ms (iOS PWA: ${isIOSPwaApp})`);
  
  // Block interaction events with simpler implementation
  const blockEvent = (e: Event) => {
    if (!(e.target instanceof Element)) return true;
    
    // Don't block controls
    const isControl = e.target.closest('[data-sheet-close]') ||
                 e.target.closest('button') ||
                 e.target.closest('[data-radix-dialog-close]');
    
    if (isControl) return true;
    
    // Block task card interactions
    const isTaskCard = e.target.closest('.task-card') || 
                  e.target.closest('[data-task-card]') ||
                  e.target.closest('[role="button"]') ||
                  (e.target.getAttribute && e.target.getAttribute('data-task-card') === 'true');
    
    if (isTaskCard) {
      console.log(`🛡️ Shield ${shieldId} blocked ${e.type} on task card`);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    return true;
  };
  
  // Add event listeners for all event types
  shield.addEventListener('touchstart', blockEvent, { capture: true, passive: false });
  shield.addEventListener('touchend', blockEvent, { capture: true, passive: false });
  shield.addEventListener('touchmove', blockEvent, { capture: true, passive: false });
  shield.addEventListener('click', blockEvent, { capture: true });
  shield.addEventListener('mousedown', blockEvent, { capture: true });
  shield.addEventListener('pointerdown', blockEvent, { capture: true });
  
  // Create a timer for shield removal
  const removalTimer = setTimeout(() => {
    removeShield();
  }, actualDuration);
  
  // Define shield removal function
  const removeShield = () => {
    if (document.body.contains(shield)) {
      document.body.removeChild(shield);
      // Decrease active shields count
      (window as any).__activeShields = Math.max(0, ((window as any).__activeShields || 0) - 1);
      console.log(`🛡️ Removed shield overlay ${shieldId}. Active shields: ${(window as any).__activeShields}`);
    }
    
    // Clear any lingering event listeners to prevent memory leaks
    shield.removeEventListener('touchstart', blockEvent, { capture: true });
    shield.removeEventListener('touchend', blockEvent, { capture: true });
    shield.removeEventListener('touchmove', blockEvent, { capture: true });
    shield.removeEventListener('click', blockEvent, { capture: true });
    shield.removeEventListener('mousedown', blockEvent, { capture: true });
    shield.removeEventListener('pointerdown', blockEvent, { capture: true });
  };
  
  // Safety fallback - remove shield after twice the duration if it's still around
  const fallbackTimer = setTimeout(() => {
    // Check if shield is still in the document
    if (document.body.contains(shield)) {
      console.log(`🛡️ Fallback removal of shield ${shieldId} that wasn't properly cleaned up`);
      removeShield();
    }
  }, actualDuration * 2);
  
  // Return a function to manually remove the shield
  return () => {
    clearTimeout(removalTimer);
    clearTimeout(fallbackTimer);
    removeShield();
  };
}

// Function to remove all shields - useful for cleanup
export function removeAllShields() {
  // Find and remove all shields
  const shields = document.querySelectorAll('[data-sharing-shield="true"]');
  shields.forEach(shield => {
    document.body.removeChild(shield);
  });
  
  // Reset shield count
  (window as any).__activeShields = 0;
  
  console.log(`🧹 Removed all shield overlays: ${shields.length} shields removed`);
}
