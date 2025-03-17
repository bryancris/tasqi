
/**
 * Utilities for debugging and normalizing notification values
 */

import { Notification } from "@/components/notifications/types";

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
  // CRITICAL FIX: Special case for "At start time" (0)
  if (reminderTime === 0) {
    console.log('🔍 formatReminderTime: Found exact 0, returning "0" string');
    return "0"; // At start time
  }
  
  return String(normalizeReminderTime(reminderTime));
}

/**
 * Debug utility to log notifications with important properties highlighted
 * Helps with tracking notification flow through the system
 */
export function debugLogNotification(notification: Notification | Partial<Notification>, context: string): void {
  console.log(`🔔 [${context}] Notification debug:`, {
    id: notification.id || 'N/A',
    title: notification.title || 'N/A',
    type: notification.type || 'N/A',
    referenceId: notification.referenceId,
    referenceIdType: notification.referenceId ? typeof notification.referenceId : 'N/A',
    referenceType: notification.referenceType || 'N/A',
    group: notification.group || 'N/A',
    persistent: notification.persistent ? 'YES' : 'NO',
    created_at: notification.created_at || 'N/A'
  });
}

/**
 * Validates if a notification is related to a task and has required properties
 * Returns true if the notification is valid for task operations
 */
export function validateTaskNotification(notification: Notification | undefined | null): boolean {
  if (!notification) {
    console.log('⚠️ validateTaskNotification: Notification is null or undefined');
    return false;
  }

  const isTask = notification.referenceType === 'task';
  const hasReferenceId = !!notification.referenceId;
  
  console.log('🔍 validateTaskNotification:', {
    isTask,
    hasReferenceId,
    referenceType: notification.referenceType,
    referenceId: notification.referenceId
  });
  
  return isTask && hasReferenceId;
}

/**
 * Checks if a notification is a test notification based on its referenceId
 * Test notifications have specific IDs for debugging
 */
export function isTestNotification(referenceId: string | number | null | undefined): boolean {
  if (referenceId === null || referenceId === undefined) {
    return false;
  }
  
  const testIds = ['999999', 999999, 'test', 'TEST'];
  
  // Convert to string for comparison
  const idStr = String(referenceId);
  
  const result = testIds.includes(idStr) || testIds.includes(Number(idStr));
  
  console.log(`🧪 Testing if ${referenceId} (${typeof referenceId}) is a test notification: ${result}`);
  
  return result;
}
