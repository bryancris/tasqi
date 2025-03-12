
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
  
  // Fix: Ensure we use === true for boolean comparison
  const showingButtons = 
    (referenceId !== undefined && referenceId !== null) &&
    ((referenceType === 'task') || (title?.toLowerCase().includes('task')));

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
 * Validate a notification to see if it should show task buttons
 * Enhanced to be more comprehensive and reliable
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  const {
    title,
    referenceId,
    referenceType
  } = notification;

  // Always support test notifications with ID 999999
  const isTestNotification = 
    referenceId === 999999 || referenceId === "999999";
  
  if (isTestNotification) {
    console.log('🧪 TEST NOTIFICATION DETECTED:', { referenceId });
    return true;
  }

  const isValid = !!title;
  const hasReferenceId = referenceId !== undefined && referenceId !== null;
  const hasReferenceType = !!referenceType;
  const isTaskType = referenceType === 'task';
  const hasTaskInTitle = title?.toLowerCase().includes('task') || false;
  const referenceIdValue = String(referenceId);
  const referenceTypeValue = referenceType || '';
  const referenceIdType = typeof referenceId;
  const referenceIdIsNull = referenceId === null;
  const referenceIdIsUndefined = referenceId === undefined;
  const hasValidReferenceId = hasReferenceId && !referenceIdIsNull && !referenceIdIsUndefined;
  
  const shouldShowButtons = 
    hasValidReferenceId && (isTaskType || hasTaskInTitle);
  
  const titleContainsTask = title?.toLowerCase().includes('task') || false;
  const titleIncludesReminder = title?.toLowerCase().includes('reminder') || false;
  const messageContainsTask = notification.message?.toLowerCase().includes('task') || false;
  
  const buttonVisibilityCheck = `${hasValidReferenceId} && (${isTaskType} || ${hasTaskInTitle})`;
  
  console.log('🧪 Enhanced notification validation:', {
    isValid,
    hasReferenceId,
    hasReferenceType,
    isTaskType,
    hasTaskType: isTaskType,
    hasTaskInTitle,
    referenceIdValue,
    referenceTypeValue,
    referenceIdType,
    referenceIdIsNull,
    referenceIdIsUndefined,
    hasValidReferenceId,
    shouldShowButtons,
    titleContainsTask,
    titleIncludesReminder,
    messageContainsTask,
    buttonVisibilityCheck
  });
  
  return shouldShowButtons || isTestNotification;
};

/**
 * Special validation just for test notifications with ID 999999
 */
export const isTestNotification = (referenceId?: number | string | null): boolean => {
  if (referenceId === undefined || referenceId === null) return false;
  
  const isTest = 
    referenceId === 999999 || 
    referenceId === "999999";
  
  if (isTest) {
    console.log('✅ Test notification detected with ID:', referenceId);
  }
  
  return isTest;
};
