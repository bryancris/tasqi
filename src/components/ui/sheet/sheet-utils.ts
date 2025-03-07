
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
  return !!(
    element.closest('[data-sharing-indicator]') || 
    element.closest('[data-sharing-sheet-id]')
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
    (window as any).__closingSharingSheet = id;
    
    // Clear after delay
    setTimeout(() => {
      if ((window as any).__closingSharingSheet === id) {
        (window as any).__closingSharingSheet = null;
      }
    }, 500);
  },
  
  isClosingSharingSheet(): boolean {
    return !!(window as any).__closingSharingSheet;
  }
};
