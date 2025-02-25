
import * as React from "react";
import { NotificationsContextType } from "../types";

export const NotificationsContext = React.createContext<NotificationsContextType>({
  notifications: [],
  showNotification: () => {},
  dismissNotification: () => {},
  dismissGroup: () => {},
  isSubscribed: false,
  isLoading: false,
  enableNotifications: async () => {},
});

export const useNotifications = () => React.useContext(NotificationsContext);
