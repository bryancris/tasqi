
/**
 * Utility functions for debugging notification issues
 */

/**
 * Logs detailed information about a notification for debugging
 * @param notification The notification object to log
 * @param stage The current stage in the notification pipeline
 */
export function debugLogNotification(notification: any, stage: string) {
  // Support both naming conventions for maximum compatibility during transition
  const referenceId = notification.referenceId || notification.reference_id;
  const referenceType = notification.referenceType || notification.reference_type;
  
  console.log(`🔍 Notification at ${stage}:`, {
    title: notification.title,
    titleLength: notification.title?.length,
    titleCharCodes: notification.title ? Array.from(notification.title).map((c: string) => c.charCodeAt(0)) : [],
    message: notification.message,
    type: notification.type,
    referenceId, // Use standardized camelCase for logging
    referenceIdValue: String(referenceId),
    referenceIdType: typeof referenceId,
    referenceType, // Use standardized camelCase for logging
    isTask: (referenceType === 'task'),
    isTaskBasedOnTitle: notification.title?.toLowerCase().includes('task'),
    showingButtons: Boolean(referenceId) && 
      (referenceType === 'task' || notification.title?.toLowerCase().includes('task')),
    properties: Object.keys(notification)
  });
}

/**
 * Validates that a notification has the required properties for displaying buttons
 * @param notification The notification object to validate
 * @returns An object containing validation results
 */
export function validateTaskNotification(notification: any) {
  // Support both naming conventions for backward compatibility
  const hasReferenceId = notification.referenceId !== undefined || notification.reference_id !== undefined;
  const hasReferenceType = notification.referenceType !== undefined || notification.reference_type !== undefined;
  const referenceId = notification.referenceId || notification.reference_id;
  const referenceType = notification.referenceType || notification.reference_type;
  
  // Consider ANY non-null, non-undefined referenceId as valid
  const hasValidReferenceId = referenceId !== undefined && referenceId !== null;
  
  // Check if it's task-related by type or title
  const hasTaskType = referenceType === 'task';
  const hasTaskInTitle = notification.title?.toLowerCase().includes('task') || false;
  
  const isTaskType = hasTaskType || hasTaskInTitle;

  const validationResult = {
    isValid: hasValidReferenceId && isTaskType,
    hasReferenceId,
    hasReferenceType,
    isTaskType,
    hasTaskType,
    hasTaskInTitle,
    referenceIdValue: String(referenceId),
    referenceTypeValue: referenceType,
    referenceIdType: typeof referenceId,
    referenceIdIsNull: referenceId === null,
    referenceIdIsUndefined: referenceId === undefined,
    hasValidReferenceId,
    shouldShowButtons: hasValidReferenceId && isTaskType,
    // Add more detailed information for clearer debugging
    titleContainsTask: notification.title?.toLowerCase().includes('task') || false,
    titleIncludesReminder: notification.title?.toLowerCase().includes('reminder') || false,
    messageContainsTask: notification.message?.toLowerCase().includes('task') || false,
    buttonVisibilityCheck: `${hasValidReferenceId} && (${referenceType === 'task'} || ${notification.title?.toLowerCase().includes('task')})`
  };
  
  console.log('🧪 Enhanced notification validation:', validationResult);
  
  return validationResult;
}
