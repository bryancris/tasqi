
/**
 * Utility functions for debugging notification issues
 */

/**
 * Logs detailed information about a notification for debugging
 * @param notification The notification object to log
 * @param stage The current stage in the notification pipeline
 */
export function debugLogNotification(notification: any, stage: string) {
  console.log(`🔍 Notification at ${stage}:`, {
    title: notification.title,
    titleLength: notification.title.length,
    titleCharCodes: Array.from(notification.title).map((c: string) => c.charCodeAt(0)),
    message: notification.message,
    type: notification.type,
    referenceId: notification.reference_id || notification.referenceId,
    reference_type: notification.reference_type || notification.referenceType,
    isTask: (notification.reference_type === 'task') || (notification.referenceType === 'task'),
    properties: Object.keys(notification)
  });
}

/**
 * Validates that a notification has the required properties for displaying buttons
 * @param notification The notification object to validate
 * @returns An object containing validation results
 */
export function validateTaskNotification(notification: any) {
  const hasReferenceId = notification.reference_id !== undefined || notification.referenceId !== undefined;
  const hasReferenceType = notification.reference_type !== undefined || notification.referenceType !== undefined;
  const isTaskType = 
    (notification.reference_type === 'task') || 
    (notification.referenceType === 'task') ||
    (notification.title?.toLowerCase().includes('task') && notification.title?.toLowerCase().includes('reminder'));

  return {
    isValid: hasReferenceId && isTaskType,
    hasReferenceId,
    hasReferenceType,
    isTaskType,
    referenceIdValue: notification.reference_id || notification.referenceId,
    reference_type: notification.reference_type || notification.referenceType
  };
}
