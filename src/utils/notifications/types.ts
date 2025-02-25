
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
