
/**
 * Utility functions for the Sheet component
 * Contains helper functions for event handling, ID generation, etc.
 */

/**
 * Generate a unique ID for a sheet
 * @returns A unique string ID
 */
export function generateSheetId(): string {
  return `sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Prevents all types of mouse/pointer events
 * Used to block events during sheet transitions
 */
export function blockAllEvents(evt: Event): boolean {
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
  
  // Add multiple event listeners to catch all types of interactions
  document.addEventListener('click', blockAllEvents, { capture: true });
  document.addEventListener('mousedown', blockAllEvents, { capture: true });
  document.addEventListener('mouseup', blockAllEvents, { capture: true });
  document.addEventListener('pointerdown', blockAllEvents, { capture: true });
  document.addEventListener('pointerup', blockAllEvents, { capture: true });
  
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

/**
 * Check if an element is part of a calendar, popover, or other special element
 * that should prevent sheet closing
 */
export function isSpecialElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  
  // Check for calendar elements
  if (
    element.closest('.rdp') || 
    element.closest('.react-calendar') || 
    element.closest('.calendar') || 
    element.closest('[data-radix-popper-content-wrapper]') ||
    element.closest('[data-radix-popup-content]') ||
    element.closest('.DayPicker') ||
    element.closest('.DayPicker-Month') ||
    element.closest('.DayPicker-Day')
  ) {
    return true;
  }
  
  // Check for any other special elements that should prevent closing
  const queryElement = document.querySelector('[data-radix-popper-content-wrapper]');
  const zIndexElement = document.querySelector('.z-\\[9999\\]');
  
  return (
    (queryElement && queryElement.contains(element)) ||
    (zIndexElement && zIndexElement.contains(element))
  );
}

/**
 * Check if element is part of an open popover dialog
 */
export function isPopoverElement(target: Node | null): boolean {
  if (!target) return false;
  
  const popoverElements = document.querySelectorAll('[role="dialog"][data-state="open"]');
  for (const element of popoverElements) {
    if (element.contains(target)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if element is related to sharing functionality
 */
export function isSharingRelated(element: HTMLElement): boolean {
  if (!element) return false;
  
  return !!(
    element.closest('[data-sharing-indicator]') || 
    element.closest('[data-sharing-sheet-id]') ||
    element.hasAttribute('data-sharing-indicator') ||
    element.hasAttribute('data-sharing-sheet-id')
  );
}

/**
 * Global registry for active sheets and sharing sheets
 */
export const SheetRegistry = {
  activeSheets: {} as Record<string, boolean>,
  closingSharingSheet: null as string | null,
  
  registerSheet(id: string): void {
    if (typeof window !== 'undefined') {
      (window as any).__activeSheets = (window as any).__activeSheets || {};
      (window as any).__activeSheets[id] = true;
    }
  },
  
  unregisterSheet(id: string): void {
    if (typeof window !== 'undefined' && (window as any).__activeSheets) {
      delete (window as any).__activeSheets[id];
    }
  },
  
  markClosingSharingSheet(id: string): void {
    if (typeof window !== 'undefined') {
      (window as any).__closingSharingSheet = id;
      // Set a global flag to track closing state
      (window as any).__isClosingSharingSheet = true;
      (window as any).__sharingSheetCloseTime = Date.now();
      
      // Clear after longer delay (1500ms instead of 800ms)
      setTimeout(() => {
        if ((window as any).__closingSharingSheet === id) {
          (window as any).__closingSharingSheet = null;
          (window as any).__isClosingSharingSheet = false;
        }
      }, 1500); 
    }
  },
  
  isClosingSharingSheet(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isClosing = !!(window as any).__closingSharingSheet || !!(window as any).__isClosingSharingSheet;
    
    // Also check if the closing happened recently (within 1500ms)
    if (!isClosing) {
      const closeTime = (window as any).__sharingSheetCloseTime || 0;
      const now = Date.now();
      const timeSinceClose = now - closeTime;
      
      return timeSinceClose < 1500;
    }
    
    return isClosing;
  }
};
