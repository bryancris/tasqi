
/**
 * Debug utilities for notifications
 * These help trace notification related issues
 */

// Log notification details
export const debugLogNotification = (notification: any, source: string = 'unknown') => {
  console.log(`🔍 [${source}] Notification:`, {
    id: notification.id || 'no-id',
    title: notification.title,
    message: notification.message,
    referenceId: notification.referenceId || notification.reference_id,
    referenceType: notification.referenceType || notification.reference_type,
    type: notification.type
  });
};

// Validate if notification should show task-specific buttons
export const validateTaskNotification = (notification: any) => {
  const hasReferenceType = !!notification.referenceType || !!notification.reference_type;
  const hasReferenceId = !!notification.referenceId || !!notification.reference_id;
  const isTaskType = (notification.referenceType || notification.reference_type) === 'task';
  
  console.log(`🔘 Task Notification Validation:`, {
    hasReferenceType,
    hasReferenceId,
    isTaskType,
    shouldShowButtons: hasReferenceType && hasReferenceId && isTaskType
  });
  
  return hasReferenceType && hasReferenceId && isTaskType;
};

// Check if this is a test notification
export const isTestNotification = (referenceId: number | string | null | undefined): boolean => {
  if (referenceId === null || referenceId === undefined) return false;
  return String(referenceId) === '999999' || referenceId === 999999;
};

// Log notification debugging info
export const logNotificationDetails = (notification: any) => {
  console.group('📋 Notification Details');
  console.log('Title:', notification.title);
  console.log('Message:', notification.message);
  console.log('Reference ID:', notification.referenceId || notification.reference_id);
  console.log('Reference Type:', notification.referenceType || notification.reference_type);
  console.log('Should Show Buttons:', validateTaskNotification(notification));
  console.groupEnd();
};
