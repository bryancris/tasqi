
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
  
  // SIMPLIFIED: Use both string and number comparison for 999999
  const isTestNotification = 
    referenceId === 999999 || referenceId === "999999";
  
  // SIMPLIFIED: This is the key calculation for showing buttons
  const showingButtons = 
    (isTestNotification) || 
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
    isTestNotification,
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
 * SIMPLIFIED: Just check referenceId directly - always check both string and number form
 */
export const isTestNotification = (referenceId?: number | string | null): boolean => {
  return referenceId === 999999 || referenceId === "999999";
};

/**
 * SIMPLIFIED: Much simpler validation with explicit test for 999999
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  // TEST NOTIFICATION - highest priority check
  if (isTestNotification(notification.referenceId)) {
    return true;
  }
  
  // Regular task notification check
  return !!notification.referenceId && 
    (notification.referenceType === 'task' || 
     notification.title?.toLowerCase().includes('task'));
};
