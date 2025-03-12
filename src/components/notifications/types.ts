
export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  read: boolean;
  created_at: string;
  referenceId?: string | number | null; // Changed from reference_id to camelCase
  referenceType?: string | null;        // Changed from reference_type to camelCase
  user_id: string;
  group?: string;
  persistent?: boolean;
}

export interface NotificationsContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'user_id'>) => void;
  dismissNotification: (id: string) => void;
  dismissGroup: (group: string) => void;
  isSubscribed: boolean;
  isLoading: boolean;
  enableNotifications: () => Promise<void>;
}
