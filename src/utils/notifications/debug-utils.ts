
import { Notification } from "@/components/notifications/types";

/**
 * Debug log function to help trace notification properties
 * Especially useful for tracking task notifications and their data
 */
export function debugLogNotification(notification: Notification, context: string = 'unknown') {
  console.log(`📋 NOTIFICATION DEBUG [${context}]:`, {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type || 'none',
    reference: {
      id: notification.referenceId,
      type: notification.referenceType,
      idType: notification.referenceId ? typeof notification.referenceId : 'undefined'
    },
    data: notification.data || 'no data', // Log data property if it exists
    ...(notification.data ? {
      reminderTime: notification.data.reminderTime,
      isAtStartTime: notification.data.isAtStartTime
    } : {})
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
