
export class ServiceWorkerManager {
  private swRegistration: ServiceWorkerRegistration | null = null;

  async register(): Promise<ServiceWorkerRegistration | null> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return null;
      }

      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      if (this.swRegistration.active) {
        this.swRegistration.active.postMessage({ type: 'TAKE_CONTROL' });
      }

      return this.swRegistration;
    } catch (error) {
      console.error('❌ Failed to register service worker:', error);
      throw error;
    }
  }

  async setupBackgroundSync(): Promise<void> {
    try {
      if (this.swRegistration && 'sync' in (this.swRegistration as any)) {
        await (this.swRegistration as any).sync.register('notification-sync');
        console.log('✅ Background sync registered');
      }
    } catch (error) {
      console.error('❌ Background sync registration failed:', error);
    }
  }

  async setupPeriodicSync(interval: number): Promise<void> {
    try {
      if (!this.swRegistration) return;

      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName
      });

      if (status.state === 'granted') {
        await (this.swRegistration as any).periodicSync.register('check-notifications', {
          minInterval: interval * 60 * 1000
        });
        console.log('✅ Periodic sync registered');
      }
    } catch (error) {
      console.error('❌ Periodic sync registration failed:', error);
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }
}
