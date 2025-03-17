
import { Notification } from "@/components/notifications/types";

/**
 * Debug log function to help trace notification properties
 * Especially useful for tracking task notifications and their data
 */
export function debugLogNotification(notification: Notification, context: string = 'unknown') {
  // FIXED: Enhanced debug log to be more explicit about "At start time" values
  const reminderTime = notification.data?.reminderTime;
  const isAtStartTime = reminderTime === 0;
  
  console.log(`📋 NOTIFICATION DEBUG [${context}]:`, {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type || 'none',
    priority: notification.priority || 'normal',
    reference: {
      id: notification.referenceId,
      type: notification.referenceType,
      idType: notification.referenceId ? typeof notification.referenceId : 'undefined'
    },
    data: notification.data || 'no data',
    reminderDetails: notification.data ? {
      reminderTime,
      reminderTimeType: typeof reminderTime,
      isExactlyZero: reminderTime === 0,
      isAtStartTime,
      explicitAtStartTime: `${isAtStartTime ? 'YES - AT START TIME' : 'NO - has minutes before'}`
    } : 'no reminder data'
  });
}

/**
 * Validates if a notification is a properly structured task notification
 * that should display action buttons
 */
export function validateTaskNotification(notification: Notification | undefined): boolean {
  if (!notification) {
    console.log('❌ Notification validation failed: No notification provided');
    return false;
  }

  const isTaskType = notification.referenceType === 'task';
  const hasReferenceId = !!notification.referenceId;
  
  // Additional check for isAtStartTime in data
  const hasRequiredData = !!notification.data;
  
  const isValid = isTaskType && hasReferenceId;
  
  if (!isValid) {
    console.log('❌ Task notification validation failed:', {
      isTaskType,
      hasReferenceId,
      hasRequiredData,
      notification
    });
  }
  
  return isValid;
}

/**
 * Helper function to check if a notification is a test notification
 * Used for testing notification UI without sending real notifications
 */
export function isTestNotification(referenceId: string | number | null | undefined): boolean {
  // Test notifications have a specific ID (999999)
  return referenceId === "999999" || referenceId === 999999;
}

/**
 * FIXED: Helper function to ensure consistent "At start time" values
 * This normalizes any zero or "0" values to ensure proper handling
 */
export function normalizeReminderTime(reminderTime: any): number {
  // If it's explicitly 0, keep it as 0 ("At start time")
  if (reminderTime === 0) {
    console.log('✅ Normalizing: Found exact 0, keeping as "At start time"');
    return 0;
  }
  
  // If it's a string "0", convert to number 0
  if (reminderTime === "0") {
    console.log('✅ Normalizing: Found string "0", converting to 0 for "At start time"');
    return 0;
  }
  
  // For any other values, convert to number
  const numValue = Number(reminderTime);
  
  // If conversion resulted in 0, it's "At start time"
  if (numValue === 0) {
    console.log('✅ Normalizing: Converted value to 0 for "At start time"');
    return 0;
  }
  
  // If it's a valid number, use it
  if (!isNaN(numValue)) {
    console.log(`✅ Normalizing: Using valid number value: ${numValue}`);
    return numValue;
  }
  
  // Default to 0 ("At start time") if we can't determine a valid value
  console.log('⚠️ Normalizing: Invalid value, defaulting to 0 ("At start time")');
  return 0;
}
