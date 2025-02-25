
import { toast } from "sonner";
import { NotificationData, NotificationSubscription, NotificationAction } from "./types";
import { ServiceWorkerManager } from "./serviceWorkerManager";
import { SubscriptionManager } from "./subscriptionManager";
import { QueueManager } from "./queueManager";

class NotificationService {
  private swManager: ServiceWorkerManager;
  private subManager: SubscriptionManager | null = null;
  private queueManager: QueueManager;
  private periodicSyncInterval = 15; // minutes
  private initialized = false;

  constructor() {
    this.swManager = new ServiceWorkerManager();
    this.queueManager = new QueueManager();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('✅ Notification service already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing notification service...');
      const registration = await this.swManager.register();
      
      if (registration) {
        this.subManager = new SubscriptionManager(registration);
        await this.queueManager.loadQueuedNotifications();
        await this.swManager.setupBackgroundSync();
        await this.swManager.setupPeriodicSync(this.periodicSyncInterval);
        await this.queueManager.processNotificationQueue(this.showNotification.bind(this));
        
        // Request notification permission if not granted
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          console.log('📱 Notification permission:', permission);
        }
      }
      
      this.initialized = true;
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

  async showNotification(notification: NotificationData): Promise<void> {
    console.log('🔔 Showing PWA notification:', notification);
    
    const registration = this.swManager.getRegistration();
    if (!registration) {
      console.error('❌ Service Worker not registered');
      return;
    }

    try {
      // Play notification sound
      const audio = new Audio('/notification-sound.mp3');
      await audio.play();

      const notificationOptions: NotificationOptions = {
        body: notification.message,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: notification.groupId,
        renotify: true,
        requireInteraction: notification.priority === 'high',
        data: notification.data,
        actions: [
          {
            action: 'view',
            title: 'View'
          }
        ]
      };

      // Show notification
      await registration.showNotification(notification.title, notificationOptions);

      console.log('✅ PWA notification shown successfully');
    } catch (error) {
      console.error('❌ Error showing PWA notification:', error);
      // Fallback to toast notification if PWA notification fails
      toast.error('Failed to show notification');
    }
  }
}

export const notificationService = new NotificationService();
