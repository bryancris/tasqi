
import * as React from "react";
import { NotificationsContextType } from "../types";

export const NotificationsContext = React.createContext<NotificationsContextType>({
  notifications: [],
  showNotification: () => {},
  dismissNotification: () => {},
  dismissGroup: () => {},
});

export const useNotifications = () => React.useContext(NotificationsContext);
