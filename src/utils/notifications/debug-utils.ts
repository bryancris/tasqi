
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
 * CRITICAL: Most reliable check for test notification (ID 999999)
 * This function MUST always return true for the test notification ID
 * regardless of the ID type (string or number)
 */
export const isTestNotification = (referenceId?: number | string | null): boolean => {
  // First, handle all falsy cases upfront for clarity
  if (referenceId === null || referenceId === undefined || referenceId === '') {
    console.log('🧪 Test notification check: ID is falsy, returning false');
    return false;
  }
  
  // Ensure consistent string comparison regardless of input type
  const idAsString = String(referenceId).trim();
  const result = idAsString === "999999";
  
  // Log detailed debugging for this critical check
  console.log(`🧪 Test notification check: ID=${referenceId}, type=${typeof referenceId}, stringValue=${idAsString}, result=${result}`);
  
  return result;
};

/**
 * Validates that a notification should show task buttons
 * For test notifications (999999), always returns true
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  // MOST IMPORTANT: Test notification ID 999999 ALWAYS shows task buttons
  if (isTestNotification(notification.referenceId)) {
    console.log('🧪 TEST NOTIFICATION VALIDATED - ID:', notification.referenceId);
    return true;
  }
  
  // Regular task notification check
  const isTaskNotification = !!notification.referenceId && 
    (notification.referenceType === 'task' || 
     notification.title?.toLowerCase().includes('task'));
  
  console.log('✅ Task validation result:', isTaskNotification, 'for ID:', notification.referenceId);
  
  return isTaskNotification;
};
