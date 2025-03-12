
/**
 * Utility functions for debugging notification issues
 */

export interface DebugNotification {
  title: string;
  message: string;
  type?: string;
  referenceId?: number | string | null;
  referenceType?: string | null;
  [key: string]: any;
}

/**
 * Log detailed notification information for debugging
 */
export const debugLogNotification = (
  notification: DebugNotification,
  source: string
) => {
  const {
    title,
    message,
    type,
    referenceId,
    referenceType,
    ...rest
  } = notification;

  // Convert title to character codes for debugging
  const titleCharCodes = Array.from(title || '').map(char => char.charCodeAt(0));
  
  const isTask = (referenceType === 'task') || 
               (title?.toLowerCase().includes('task')) ||
               (message?.toLowerCase().includes('task'));
  
  const isTaskBasedOnTitle = title?.toLowerCase().includes('task');
  
  // Fast check for test notification ID
  const isTestNotificationInstance = isTestNotification(referenceId);
  
  // This is the key calculation for showing buttons
  const showingButtons = 
    (isTestNotificationInstance) || 
    ((referenceId !== undefined && referenceId !== null) &&
     ((referenceType === 'task') || (title?.toLowerCase().includes('task'))));

  console.log(`🔍 Notification at ${source}:`, {
    title,
    titleLength: title?.length,
    titleCharCodes,
    message,
    type,
    referenceId,
    referenceIdValue: referenceId !== undefined ? String(referenceId) : undefined,
    referenceIdType: typeof referenceId,
    referenceType,
    isTask,
    isTaskBasedOnTitle,
    isTestNotification: isTestNotificationInstance,
    showingButtons,
    properties: Object.keys({
      title,
      message,
      type,
      referenceId,
      referenceType,
      ...rest
    })
  });
};

/**
 * Most important function: Check for test notification (ID 999999)
 * This must work correctly in all scenarios!
 */
export const isTestNotification = (referenceId?: number | string | null): boolean => {
  if (referenceId === null || referenceId === undefined) {
    return false;
  }
  
  // Critical: Convert to string first, then compare to ensure consistent behavior
  const idAsString = String(referenceId);
  const result = idAsString === "999999";
  
  // For debugging:
  console.log(`🧪 Test notification check: ID=${referenceId}, type=${typeof referenceId}, stringValue=${idAsString}, result=${result}`);
  
  return result;
};

/**
 * Validates that a notification should show task buttons
 * For test notifications (999999), always returns true
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  // CRITICAL: Test notification is always a task notification
  if (isTestNotification(notification.referenceId)) {
    console.log('🧪 TEST NOTIFICATION VALIDATED - ID:', notification.referenceId);
    return true;
  }
  
  // Regular task notification check
  return !!notification.referenceId && 
    (notification.referenceType === 'task' || 
     notification.title?.toLowerCase().includes('task'));
};
