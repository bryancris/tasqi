
/**
 * Utility functions for handling events
 */
import { isIOSPWA } from "@/utils/platform-detection";

/**
 * Prevents all types of mouse/pointer events
 * Used to block events during sheet transitions
 */
export function blockAllEvents(evt: Event): boolean {
  // Special handling for close button - never block it
  if (evt.target instanceof Element) {
    const isCloseButton = 
      evt.target.closest('[data-sheet-close]') || 
      evt.target.hasAttribute('data-sheet-close') ||
      evt.target.closest('[data-radix-dialog-close]');
    
    if (isCloseButton) {
      console.log('🔄 Not blocking event for close button');
      return true; // Allow event to proceed for close buttons
    }
  }
  
  // Block all other events
  evt.stopPropagation();
  evt.preventDefault();
  return false;
}

/**
 * Add event blockers to prevent unwanted interactions
 * @param duration How long the blockers should remain active
 * @param cleanupCallback Optional callback for when blockers are removed
 * @returns A function to manually remove the blockers
 */
export function addEventBlockers(
  duration: number = 500,
  cleanupCallback?: () => void
): () => void {
  // Set a global flag to indicate event blocking is active
  (window as any).__eventBlockersActive = true;
  (window as any).__eventBlockersStartTime = Date.now();
  
  // Check for iOS PWA to apply platform-specific behaviors
  const isIOSPwaApp = isIOSPWA();
  
  // Enhanced event blocker that doesn't block close button interactions
  const blockEventsExceptClose = (e: Event) => {
    if (e.target instanceof Element) {
      // Check if this is a close button or control
      const isCloseButton = 
        e.target.closest('[data-sheet-close]') || 
        e.target.hasAttribute('data-sheet-close') ||
        e.target.closest('[data-radix-dialog-close]');
      
      // Allow close button events to pass through
      if (isCloseButton) {
        console.log(`🔄 Allowing ${e.type} event on close button`);
        return true;
      }
      
      // For non-close button elements, block the event
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
    return true;
  };
  
  // Add multiple event listeners to catch all types of interactions
  document.addEventListener('click', blockEventsExceptClose, { capture: true });
  document.addEventListener('mousedown', blockEventsExceptClose, { capture: true });
  document.addEventListener('mouseup', blockEventsExceptClose, { capture: true });
  document.addEventListener('pointerdown', blockEventsExceptClose, { capture: true });
  document.addEventListener('pointerup', blockEventsExceptClose, { capture: true });
  
  // For iOS PWA, also block touchstart events which can cause drawer to open
  if (isIOSPwaApp) {
    const blockTouchEvents = (e: TouchEvent) => {
      if (e.target instanceof Element) {
        // Check if this is a close button
        const isCloseButton = 
          e.target.closest('[data-sheet-close]') || 
          e.target.hasAttribute('data-sheet-close') ||
          e.target.closest('[data-radix-dialog-close]');
        
        // Allow close button events to pass through
        if (isCloseButton) {
          console.log(`🔄 Allowing touch event on close button`);
          return true;
        }
        
        // Only block touchstart on task cards, not on control elements
        const isTaskCard = e.target.closest('.task-card') || 
                         e.target.closest('[data-task-card]') ||
                         e.target.closest('[role="button"]') && 
                         !e.target.closest('button') && 
                         !e.target.closest('[data-radix-dialog-close]');
                         
        if (isTaskCard) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      return true;
    };
    
    document.addEventListener('touchstart', blockTouchEvents, { 
      capture: true,
      passive: false // Required to make preventDefault work
    });
    
    document.addEventListener('touchend', blockTouchEvents, { 
      capture: true,
      passive: false 
    });
    
    // Remove touchstart blockers after a shorter time
    setTimeout(() => {
      document.removeEventListener('touchstart', blockTouchEvents, { capture: true });
      document.removeEventListener('touchend', blockTouchEvents, { capture: true });
    }, Math.min(duration, 500));
  }
  
  // Set timeout to remove blockers
  const timeoutId = setTimeout(() => {
    removeEventBlockers();
    if (cleanupCallback) cleanupCallback();
  }, duration);
  
  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    removeEventBlockers();
  };
}

/**
 * Remove all event blockers
 */
export function removeEventBlockers(): void {
  document.removeEventListener('click', blockAllEvents, { capture: true });
  document.removeEventListener('mousedown', blockAllEvents, { capture: true });
  document.removeEventListener('mouseup', blockAllEvents, { capture: true });
  document.removeEventListener('pointerdown', blockAllEvents, { capture: true });
  document.removeEventListener('pointerup', blockAllEvents, { capture: true });
  
  // Reset the global flag
  (window as any).__eventBlockersActive = false;
}

/**
 * Check if event blockers are currently active
 */
export function areEventBlockersActive(): boolean {
  // Check if blockers are active
  const blockersActive = (window as any).__eventBlockersActive;
  
  // If blockers are active, also check if they've been active for more than 3 seconds
  // This helps prevent bugs where blockers get stuck active
  if (blockersActive) {
    const startTime = (window as any).__eventBlockersStartTime || 0;
    const currentTime = Date.now();
    
    // If blockers have been active for more than 3 seconds, they're probably stuck
    if (currentTime - startTime > 3000) {
      removeEventBlockers();
      return false;
    }
  }
  
  return blockersActive || false;
}
