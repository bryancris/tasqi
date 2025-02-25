
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
  reference_id?: string | null;
  reference_type?: string | null;
  user_id: string;
  group?: string;
  persistent?: boolean;
}

export interface NotificationsContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'user_id'>) => void;
  dismissNotification: (id: string) => void;
  dismissGroup: (group: string) => void;
}
