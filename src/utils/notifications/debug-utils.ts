
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
  
  const isTask = referenceType === 'task' || 
               title?.toLowerCase().includes('task') ||
               message?.toLowerCase().includes('task');
  
  const isTaskBasedOnTitle = title?.toLowerCase().includes('task');
  
  const showingButtons = 
    (referenceId !== undefined && referenceId !== null) &&
    (referenceType === 'task' || title?.toLowerCase().includes('task'));

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
 */
export const validateTaskNotification = (notification: DebugNotification): boolean => {
  const {
    title,
    referenceId,
    referenceType
  } = notification;

  const isValid = !!title;
  const hasReferenceId = referenceId !== undefined && referenceId !== null;
  const hasReferenceType = !!referenceType;
  const isTaskType = referenceType === 'task';
  const hasTaskType = isTaskType;
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
    hasTaskType,
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
  
  return shouldShowButtons;
};
