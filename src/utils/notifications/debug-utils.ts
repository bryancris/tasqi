
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
  
  // CRITICAL: Direct string comparison ensures most reliable test detection
  const stringId = typeof referenceId === 'string' || typeof referenceId === 'number' 
    ? String(referenceId) 
    : '';
  
  const isTestNotification = stringId === '999999';
  
  // This is the key calculation for showing buttons
  const showingButtons = isTestNotification || 
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
 * DRASTICALLY SIMPLIFIED: Direct string/number comparison for test notifications
 */
export const isTestNotification = (referenceId?: number | string | null): boolean => {
  // Direct string comparison is most reliable
  const stringId = referenceId !== undefined && referenceId !== null ? String(referenceId) : '';
  const isTest = stringId === '999999';
  
  console.log(`🧪 TEST ID CHECK: "${stringId}" === "999999" => ${isTest}`);
  return isTest;
};

/**
 * Validates that a notification should show task buttons
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  // MOST IMPORTANT: Direct string comparison for test notifications
  const stringId = notification.referenceId !== undefined && notification.referenceId !== null 
    ? String(notification.referenceId) 
    : '';
  
  // Test notifications ALWAYS return true to show buttons
  if (stringId === '999999') {
    console.log('🧪 TEST NOTIFICATION VALIDATED - ID matches 999999 exactly');
    return true;
  }
  
  // Regular task notification check
  const isTaskNotification = !!notification.referenceId && 
    (notification.referenceType === 'task' || 
     notification.title?.toLowerCase().includes('task'));
  
  console.log('✅ Task validation result:', isTaskNotification, 'for ID:', notification.referenceId);
  
  return isTaskNotification;
};

/**
 * Test function to force test notification
 */
export const triggerTestNotification = () => {
  console.log('🧪 DEBUG: Manually triggering test notification with ID 999999');
  return {
    title: 'Task Reminder',
    message: 'This is a test notification with action buttons',
    type: 'info',
    persistent: true,
    referenceId: '999999',
    referenceType: 'task'
  };
};
