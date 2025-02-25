
import { toast } from "sonner";
import { NotificationData, NotificationSubscription } from "./types";
import { ServiceWorkerManager } from "./serviceWorkerManager";
import { SubscriptionManager } from "./subscriptionManager";
import { QueueManager } from "./queueManager";

class NotificationService {
  private swManager: ServiceWorkerManager;
  private subManager: SubscriptionManager | null = null;
  private queueManager: QueueManager;
  private periodicSyncInterval = 15; // minutes

  constructor() {
    this.swManager = new ServiceWorkerManager();
    this.queueManager = new QueueManager();
  }

  async initialize(): Promise<void> {
    try {
      const registration = await this.swManager.register();
      
      if (registration) {
        this.subManager = new SubscriptionManager(registration);
        await this.queueManager.loadQueuedNotifications();
        await this.swManager.setupBackgroundSync();
        await this.swManager.setupPeriodicSync(this.periodicSyncInterval);
        await this.queueManager.processNotificationQueue(this.showNotification.bind(this));
      }
      
      console.log('✅ Notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      throw error;
    }
  }

  async subscribe(): Promise<NotificationSubscription | null> {
    if (!this.subManager) {
      throw new Error('Service Worker not registered');
    }
    return this.subManager.subscribe();
  }

  private async showNotification(notification: NotificationData): Promise<void> {
    const registration = this.swManager.getRegistration();
    if (!registration) throw new Error('Service Worker not registered');

    await registration.showNotification(notification.title, {
      body: notification.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: notification.groupId,
      renotify: true,
      requireInteraction: notification.priority === 'high',
      data: notification.data
    });
  }
}

export const notificationService = new NotificationService();
