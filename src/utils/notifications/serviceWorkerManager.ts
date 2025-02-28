
export class ServiceWorkerManager {
  private swRegistration: ServiceWorkerRegistration | null = null;

  async register(): Promise<ServiceWorkerRegistration | null> {
    try {
      // Check for iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;

      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service workers not supported');
        return null;
      }

      if (!('PushManager' in window) && !isIOS) {
        console.warn('⚠️ Push notifications not supported');
        // But continue for iOS since we'll use workarounds
        if (!isIOS) {
          return null;
        }
      }

      // Wait for any existing service workers to become activated
      if (navigator.serviceWorker.controller) {
        await navigator.serviceWorker.ready;
      }

      // Use iOS-specific service worker configuration if needed
      const options = {
        scope: '/',
      };

      if (isIOS && isStandalone) {
        console.log('🍎 Registering iOS PWA service worker');
      }

      this.swRegistration = await navigator.serviceWorker.register('/sw.js', options);

      console.log('✅ ServiceWorker registered successfully');

      // Request notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log('📱 Notification permission:', permission);
        } catch (permError) {
          console.warn('⚠️ Error requesting notification permission:', permError);
          // Continue anyway, especially for iOS
        }
      }

      if (this.swRegistration.active) {
        // Send platform info to the service worker
        this.swRegistration.active.postMessage({ 
          type: 'TAKE_CONTROL',
          platform: isIOS && isStandalone ? 'ios-pwa' : 'web'
        });
        
        if (isIOS && isStandalone) {
          // Special message for iOS PWA mode
          this.swRegistration.active.postMessage({ 
            type: 'INIT_IOS_NOTIFICATIONS' 
          });
        }
      }

      return this.swRegistration;
    } catch (error) {
      console.error('❌ Failed to register service worker:', error);
      throw error;
    }
  }

  async setupBackgroundSync(): Promise<void> {
    try {
      // Check if this is an iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        // iOS has limited background sync support, so we log this
        console.log('🍎 iOS has limited background sync support');
        // We still try, but it might not work as expected
      }
      
      if (this.swRegistration && 'sync' in (this.swRegistration as any)) {
        await (this.swRegistration as any).sync.register('notification-sync');
        console.log('✅ Background sync registered');
      } else {
        console.log('⚠️ Background sync not supported in this browser');
      }
    } catch (error) {
      console.error('❌ Background sync registration failed:', error);
    }
  }

  async setupPeriodicSync(interval: number): Promise<void> {
    try {
      if (!this.swRegistration) return;

      // Check for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        console.log('🍎 iOS does not support periodic background sync');
        return; // Don't attempt on iOS as it's not supported
      }

      // Check if periodic sync is available
      if ('periodicSync' in (this.swRegistration as any)) {
        try {
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync' as PermissionName
          });

          if (status.state === 'granted') {
            await (this.swRegistration as any).periodicSync.register('check-notifications', {
              minInterval: interval * 60 * 1000
            });
            console.log('✅ Periodic sync registered');
          } else {
            console.log('⚠️ Periodic background sync permission not granted');
          }
        } catch (permError) {
          console.warn('⚠️ Error checking periodic sync permission:', permError);
        }
      } else {
        console.log('⚠️ Periodic background sync not supported in this browser');
      }
    } catch (error) {
      console.error('❌ Periodic sync registration failed:', error);
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }
}
