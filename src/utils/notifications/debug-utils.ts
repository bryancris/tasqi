/**
 * Debug utilities for working with reminder times
 */

/**
 * Formats a reminder time value for display in UI or debugging
 * This handles special cases like the "At start time" value (0)
 */
export function formatReminderTime(value: number | string): string {
  // Handle special case for "At start time" (0)
  if (typeof value === 'number' && value === 0) {
    return "0"; // Preserve the exact 0 value for "At start time"
  }
  
  if (typeof value === 'string' && value === "0") {
    return "0"; // Also handle string "0" case
  }
  
  // For other values, ensure it's a string for dropdown selection
  return String(value);
}

/**
 * Normalizes a reminder time to ensure it's one of our valid options
 * This is important when values might come from external sources or user input
 */
export function normalizeReminderTime(value: number | string | undefined | null): number {
  // Handle undefined/null values
  if (value === undefined || value === null) {
    return 0; // Default to "At start time"
  }
  
  // Convert to a number for comparison
  const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
  
  // Check if it's a valid number
  if (isNaN(numericValue)) {
    return 0; // Default to "At start time" for invalid values
  }
  
  // Special handling for the "At start time" case (0)
  if (numericValue === 0) {
    return 0;
  }
  
  // For other values, check if they match our known options
  // After removing 15 minutes, we only have 5, 10, 30, and 60 minute options
  const validOptions = [0, 5, 10, 30, 60];
  
  if (validOptions.includes(numericValue)) {
    return numericValue;
  }
  
  // For values that don't match any valid option, find the closest one
  // For example, if someone previously selected 15, make it 10 minutes
  if (numericValue > 0 && numericValue < 10) {
    return 5; // Round to 5 minutes
  } else if (numericValue >= 10 && numericValue < 30) {
    return 10; // Round to 10 minutes (including the old 15 min option)
  } else if (numericValue >= 30 && numericValue < 60) {
    return 30; // Round to 30 minutes
  } else if (numericValue >= 60) {
    return 60; // Round to 1 hour
  }
  
  // Default fallback
  return 0;
}
