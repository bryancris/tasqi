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
  console.log(`⚙️ normalizeReminderTime called with: ${reminderTime} (${typeof reminderTime})`);
  
  // Explicitly check for exact 0 (strict equality)
  if (reminderTime === 0) {
    console.log('✅ Found exact 0, returning "At start time"');
    return 0;
  }
  
  // String "0" should be treated as 0
  if (reminderTime === "0") {
    console.log('✅ Found string "0", converting to 0 for "At start time"');
    return 0;
  }
  
  // Try to convert to number
  const numValue = Number(reminderTime);
  
  // If conversion resulted in 0, it's "At start time"
  if (numValue === 0) {
    console.log('✅ Conversion resulted in 0, using "At start time"');
    return 0;
  }
  
  // For any non-zero valid number, use it
  if (!isNaN(numValue)) {
    console.log(`✅ Using valid number: ${numValue}`);
    return numValue;
  }
  
  // Default fallback (though we shouldn't reach here)
  console.log('⚠️ Invalid value, defaulting to 15 minutes');
  return 15;
}
