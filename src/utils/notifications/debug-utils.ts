
/**
 * Utilities for debugging and normalizing notification values
 */

/**
 * Normalizes reminder time values to ensure consistent handling
 * throughout the application. Special handling for "At start time" (0)
 * to preserve it explicitly.
 */
export function normalizeReminderTime(value: number | null | undefined): number {
  // CRITICAL: Explicit check for 0 to preserve "At start time"
  if (value === 0) {
    console.log('🔍 Preserving "At start time" (0) value');
    return 0;
  }
  
  // Handle null/undefined
  if (value === null || value === undefined) {
    console.log('🔍 Defaulting null/undefined to 15 minutes');
    return 15;
  }
  
  // Convert to number if it's a string or any other type
  try {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.log('🔍 Invalid value, defaulting to 15 minutes');
      return 15;
    }
    
    // Extra check to preserve 0 for good measure
    if (numValue === 0) {
      console.log('🔍 Preserving 0 after numeric conversion');
      return 0;
    }
    
    return numValue;
  } catch (err) {
    console.error('Error converting reminder time:', err);
    return 15;
  }
}

/**
 * Safely formats a reminder time for UI display
 * Ensures that "At start time" (0) is properly handled
 */
export function formatReminderTime(reminderTime: number | null | undefined): string {
  if (reminderTime === 0) {
    return "0"; // At start time
  }
  
  return String(normalizeReminderTime(reminderTime));
}
