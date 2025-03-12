
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
  
  // Direct check for test notification ID
  const isTestNotificationInstance = isTestNotification(referenceId);
  
  // SIMPLIFIED: This is the key calculation for showing buttons
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
 * Simple, direct check for test notification (ID 999999)
 * This is the most important utility function - it must work correctly!
 */
export const isTestNotification = (referenceId?: number | string | null): boolean => {
  if (referenceId === null || referenceId === undefined) {
    return false;
  }
  
  // Check both string and number formats
  return referenceId === 999999 || referenceId === "999999";
};

/**
 * Validates that a notification should show task buttons
 * For test notifications (999999), always returns true
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  // TEST NOTIFICATION - highest priority check
  if (isTestNotification(notification.referenceId)) {
    console.log('🧪 TEST NOTIFICATION VALIDATED - ID:', notification.referenceId);
    return true;
  }
  
  // Regular task notification check
  return !!notification.referenceId && 
    (notification.referenceType === 'task' || 
     notification.title?.toLowerCase().includes('task'));
};
