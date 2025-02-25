
export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  priority?: 'high' | 'normal' | 'low';
  groupId?: string;
  data?: Record<string, any>;
}

export interface NotificationQueue {
  id: string;
  notification: NotificationData;
  timestamp: number;
  retries: number;
}

// Add NotificationAction type for PWA notifications
export interface NotificationAction {
  action: string;
  title: string;
}

// Extend NotificationOptions to include actions
declare global {
  interface NotificationOptions {
    actions?: NotificationAction[];
  }
}
