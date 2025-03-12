
/**
 * Utility functions for debugging notification issues
 */

/**
 * Logs detailed information about a notification for debugging
 * @param notification The notification object to log
 * @param stage The current stage in the notification pipeline
 */
export function debugLogNotification(notification: any, stage: string) {
  // Get reference ID from either naming convention
  const referenceId = notification.referenceId || notification.reference_id;
  const referenceType = notification.referenceType || notification.reference_type;
  
  console.log(`🔍 Notification at ${stage}:`, {
    title: notification.title,
    titleLength: notification.title.length,
    titleCharCodes: Array.from(notification.title).map((c: string) => c.charCodeAt(0)),
    message: notification.message,
    type: notification.type,
    referenceId: referenceId, // Use standardized camelCase for logging
    referenceType: referenceType, // Use standardized camelCase for logging
    isTask: (referenceType === 'task'),
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
  
  const isTaskType = 
    (referenceType === 'task') ||
    (notification.title?.toLowerCase().includes('task') && notification.title?.toLowerCase().includes('reminder'));

  return {
    isValid: hasReferenceId && isTaskType,
    hasReferenceId,
    hasReferenceType,
    isTaskType,
    referenceIdValue: referenceId,
    referenceType: referenceType
  };
}
