
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ServiceWorkerUpdateState {
  showUpdatePrompt: boolean;
  updateReady: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorkerUpdate() {
  const [state, setState] = useState<ServiceWorkerUpdateState>({
    showUpdatePrompt: false,
    updateReady: false,
    registration: null,
  });
  
  useEffect(() => {
    let refreshing = false;
    let broadcastChannel: BroadcastChannel | null = null;
    
    const setupServiceWorkerListeners = async () => {
      try {
        broadcastChannel = new BroadcastChannel('sw-updates');
        
        broadcastChannel.addEventListener('message', (event) => {
          console.log('Received message from service worker:', event.data);
          if (event.data?.type === 'ACTIVATED') {
            if (!refreshing) {
              refreshing = true;
              toast.success('Application updated', {
                description: 'The application has been updated to the latest version.',
                duration: 5000
              });
              setTimeout(() => window.location.reload(), 1000);
            }
          }
        });

        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          setState(prev => ({ ...prev, registration: reg }));
          
          await reg.update();
          
          const handleUpdateFound = () => {
            const newWorker = reg.installing || reg.waiting;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  const currentHash = localStorage.getItem('sw-hash');
                  if (newWorker.scriptURL && currentHash !== newWorker.scriptURL) {
                    setState(prev => ({
                      ...prev,
                      showUpdatePrompt: true,
                      updateReady: true
                    }));
                    localStorage.setItem('sw-hash', newWorker.scriptURL);
                  }
                }
              });
            }
          };
          
          if (reg.waiting) {
            const currentHash = localStorage.getItem('sw-hash');
            if (reg.waiting.scriptURL && currentHash !== reg.waiting.scriptURL) {
              setState(prev => ({
                ...prev,
                showUpdatePrompt: true,
                updateReady: true
              }));
              localStorage.setItem('sw-hash', reg.waiting.scriptURL);
            }
          }
          
          reg.addEventListener('updatefound', handleUpdateFound);
          
          return () => {
            reg.removeEventListener('updatefound', handleUpdateFound);
          };
        }
      } catch (error) {
        console.error('Error setting up service worker listeners:', error);
      }
    };
    
    setupServiceWorkerListeners();
    
    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  const applyUpdate = () => {
    if (!state.registration) {
      console.error('No service worker registration available');
      return;
    }
    
    if (state.registration.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      try {
        const broadcastChannel = new BroadcastChannel('sw-updates');
        broadcastChannel.postMessage({ type: 'SKIP_WAITING' });
        broadcastChannel.close();
      } catch (error) {
        console.error('Error using broadcast channel:', error);
      }
    } else {
      window.location.reload();
    }
  };

  return {
    ...state,
    applyUpdate
  };
}
