
import { NotificationData, NotificationQueue } from "./types";

export class QueueManager {
  private notificationQueue: NotificationQueue[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;

  async loadQueuedNotifications(): Promise<void> {
    try {
      const queuedNotifications = localStorage.getItem('notificationQueue');
      if (queuedNotifications) {
        this.notificationQueue = JSON.parse(queuedNotifications);
        console.log('✅ Loaded queued notifications:', this.notificationQueue.length);
      }
    } catch (error) {
      console.error('❌ Error loading queued notifications:', error);
    }
  }

  async processNotificationQueue(showNotification: (notification: NotificationData) => Promise<void>): Promise<void> {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue[0];
      
      try {
        await showNotification(notification.notification);
        this.notificationQueue.shift();
        this.saveNotificationQueue();
      } catch (error) {
        console.error('❌ Error processing notification:', error);
        
        if (notification.retries < this.MAX_RETRIES) {
          notification.retries++;
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        } else {
          this.notificationQueue.shift();
          this.saveNotificationQueue();
        }
      }
    }
  }

  private saveNotificationQueue(): void {
    try {
      localStorage.setItem('notificationQueue', JSON.stringify(this.notificationQueue));
    } catch (error) {
      console.error('❌ Error saving notification queue:', error);
    }
  }
}
