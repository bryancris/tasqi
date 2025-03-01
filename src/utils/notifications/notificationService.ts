
import { toast } from "sonner";
import { NotificationData, NotificationSubscription, NotificationAction } from "./types";
import { ServiceWorkerManager } from "./serviceWorkerManager";
import { SubscriptionManager } from "./subscriptionManager";
import { QueueManager } from "./queueManager";
import { detectPlatform } from "./platformDetection";

class NotificationService {
  private swManager: ServiceWorkerManager;
  private subManager: SubscriptionManager | null = null;
  private queueManager: QueueManager;
  private periodicSyncInterval = 15; // minutes
  private initialized = false;
  private audioContext: AudioContext | null = null;
  private platform: 'web' | 'ios-pwa';
  private readonly isDev = process.env.NODE_ENV === 'development';

  constructor() {
    this.swManager = new ServiceWorkerManager();
    this.queueManager = new QueueManager();
    this.platform = detectPlatform();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('✅ Notification service already initialized');
      return;
    }

    try {
      // In development mode, delay initialization to prioritize app loading
      if (this.isDev) {
        console.log('🚧 Development mode: deferring full notification service initialization');
        this.initialized = true;  // Mark as initialized to prevent multiple attempts
        
        // Delay full initialization to not block the initial app load
        setTimeout(() => this.deferredInitialization(), 3000);
        return;
      }
      
      // Production initialization proceeds normally
      await this.deferredInitialization();
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      // Don't re-throw, allow app to function without notifications
      this.initialized = true; // Mark as initialized to prevent retry loops
    }
  }
  
  private async deferredInitialization(): Promise<void> {
    try {
      console.log('🚀 Initializing notification service for platform:', this.platform);
      const registration = await this.swManager.register();
      
      if (registration) {
        this.subManager = new SubscriptionManager(registration);
        await this.queueManager.loadQueuedNotifications();
        
        // Background sync has limited support on iOS
        if (this.platform !== 'ios-pwa' && !this.isDev) {
          await this.swManager.setupBackgroundSync();
          await this.swManager.setupPeriodicSync(this.periodicSyncInterval);
        } else {
          console.log('🍎 Skipping background/periodic sync setup for iOS PWA or dev mode');
        }
        
        await this.queueManager.processNotificationQueue(this.showNotification.bind(this));
        
        // Initialize audio context for notification sounds
        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (audioError) {
          console.warn('⚠️ Could not initialize audio context:', audioError);
          // This is not critical, continue without audio context
        }
        
        console.log('✅ Notification service initialized');
        this.initialized = true;
      }
    } catch (error) {
      console.error('❌ Failed in deferred initialization:', error);
      // Mark as initialized anyway to prevent retry loops
      this.initialized = true;
    }
  }

  async subscribe(): Promise<NotificationSubscription | null> {
    if (!this.subManager) {
      if (this.isDev) {
        console.log('⚠️ Development mode: Subscription manager not available');
        return null;
      }
      throw new Error('Service Worker not registered');
    }
    return this.subManager.subscribe();
  }

  private async playNotificationSound(): Promise<void> {
    try {
      // For iOS, we need user interaction to play sounds
      // This might not work in all contexts on iOS
      const isIOS = this.platform === 'ios-pwa';
      
      if (isIOS) {
        console.log('🍎 Attempting to play notification sound on iOS');
        // On iOS, use simple Audio element instead of AudioContext
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('🍎 iOS audio play failed (expected without user interaction):', error);
          });
        }
        return;
      }
      
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const response = await fetch('/notification-sound.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('❌ Error playing notification sound:', error);
    }
  }

  async showNotification(notification: NotificationData): Promise<void> {
    console.log('🔔 Showing PWA notification on platform:', this.platform);
    
    const registration = this.swManager.getRegistration();
    if (!registration) {
      console.error('❌ Service Worker not registered');
      // Fallback to toast notification
      this.showToastNotification(notification);
      return;
    }

    try {
      // Play notification sound
      await this.playNotificationSound();

      // Handle iOS PWA notifications differently
      if (this.platform === 'ios-pwa') {
        console.log('🍎 Using iOS PWA notification approach');
        
        // On iOS PWAs, in-app toast notifications are more reliable
        this.showToastNotification(notification);
        
        // Still try to show a system notification on iOS
        try {
          // Use the simpler options for iOS
          await registration.showNotification(notification.title, {
            body: notification.message,
            icon: '/pwa-192x192.png',
            // Avoid using advanced features that might not work on iOS
            tag: notification.groupId || 'task',
            data: { 
              url: '/dashboard',
              ...notification.data
            }
          });
          console.log('✅ iOS system notification attempted');
        } catch (iosNotifError) {
          console.warn('🍎 iOS system notification failed (expected limitation):', iosNotifError);
          // This is expected to fail sometimes on iOS - we already showed toast
        }
        
        return;
      }

      // Standard web platform notification
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
      this.showToastNotification(notification);
    }
  }
  
  private showToastNotification(notification: NotificationData): void {
    toast(notification.title, {
      description: notification.message,
      duration: 10000,
      action: {
        label: 'View',
        onClick: () => {
          // Navigate to appropriate screen based on notification type
          if (notification.data?.taskId) {
            window.location.href = '/dashboard';
          }
        }
      }
    });
  }
}

export const notificationService = new NotificationService();
