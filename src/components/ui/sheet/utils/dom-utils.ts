
/**
 * Utility functions for DOM interaction and element detection
 */

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
 * Generate a unique ID for a sheet
 * @returns A unique string ID
 */
export function generateSheetId(): string {
  return `sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
