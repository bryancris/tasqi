
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
  
  // This is now a direct string comparison - simple and reliable
  const isTestId = typeof referenceId === 'string' && referenceId === '999999';
  const isTestNumId = typeof referenceId === 'number' && referenceId === 999999;
  const isTestNotificationInstance = isTestId || isTestNumId;
  
  // This is the key calculation for showing buttons
  const showingButtons = isTestNotificationInstance || 
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
    isTestId,
    isTestNumId,
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
 * Much more reliable than previous complex logic
 */
export const isTestNotification = (referenceId?: number | string | null): boolean => {
  // Simple direct comparison - convert to string for logging
  const stringId = referenceId !== undefined && referenceId !== null ? String(referenceId) : '';
  const isTest = stringId === '999999';
  
  console.log(`🧪 SIMPLIFIED Test ID check: ${stringId} === '999999' => ${isTest}`);
  return isTest;
};

/**
 * Validates that a notification should show task buttons
 * DRASTICALLY SIMPLIFIED: For test notifications (999999), always returns true
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  // MOST IMPORTANT: Direct string/number comparison - much more reliable
  const stringId = notification.referenceId !== undefined && notification.referenceId !== null 
    ? String(notification.referenceId) 
    : '';
  
  if (stringId === '999999') {
    console.log('🧪 TEST NOTIFICATION VALIDATED - ID matches 999999 exactly');
    return true;
  }
  
  // Regular task notification check - needs both referenceId and task reference or task in title
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
