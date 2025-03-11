
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function UpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  // Setup event listeners for service worker updates
  useEffect(() => {
    let refreshing = false;
    let broadcastChannel: BroadcastChannel | null = null;
    
    const setupServiceWorkerListeners = async () => {
      try {
        // Create a broadcast channel for service worker communication
        broadcastChannel = new BroadcastChannel('sw-updates');
        
        // Listen for messages from the service worker
        broadcastChannel.addEventListener('message', (event) => {
          console.log('Received message from service worker:', event.data);
          if (event.data?.type === 'ACTIVATED') {
            // When service worker is activated, refresh the page if needed
            if (!refreshing) {
              refreshing = true;
              toast.success('Application updated', {
                description: 'The application has been updated to the latest version.',
                duration: 5000
              });
              // Give time for toast to show before reloading
              setTimeout(() => window.location.reload(), 1000);
            }
          }
        });

        if ('serviceWorker' in navigator) {
          // Get service worker registration
          const reg = await navigator.serviceWorker.ready;
          setRegistration(reg);
          
          // Check for updates immediately
          await reg.update();
          
          // Setup update waiting handler
          const handleUpdateFound = () => {
            const newWorker = reg.installing || reg.waiting;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Only show update prompt if we have a new version waiting
                  const currentHash = localStorage.getItem('sw-hash');
                  if (newWorker.scriptURL && currentHash !== newWorker.scriptURL) {
                    setShowUpdatePrompt(true);
                    setUpdateReady(true);
                    // Store new hash
                    localStorage.setItem('sw-hash', newWorker.scriptURL);
                  }
                }
              });
            }
          };
          
          // Check if an update is already waiting
          if (reg.waiting) {
            const currentHash = localStorage.getItem('sw-hash');
            if (reg.waiting.scriptURL && currentHash !== reg.waiting.scriptURL) {
              setShowUpdatePrompt(true);
              setUpdateReady(true);
              localStorage.setItem('sw-hash', reg.waiting.scriptURL);
            }
          }
          
          // Listen for future updates
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
  
  // Function to apply the update
  const applyUpdate = () => {
    if (!registration) {
      console.error('No service worker registration available');
      return;
    }
    
    if (registration.waiting) {
      // Send message to service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      try {
        // Also try broadcast channel for redundancy
        const broadcastChannel = new BroadcastChannel('sw-updates');
        broadcastChannel.postMessage({ type: 'SKIP_WAITING' });
        broadcastChannel.close();
      } catch (error) {
        console.error('Error using broadcast channel:', error);
      }
    } else {
      // Force reload if no waiting worker
      window.location.reload();
    }
  };
  
  if (!showUpdatePrompt || !updateReady) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg shadow-lg border border-blue-200 dark:border-blue-700">
      <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          New version available
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Reload to update the application
        </p>
      </div>
      <Button 
        size="sm" 
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
        onClick={applyUpdate}
      >
        <RefreshCw className="w-4 h-4" />
        Update
      </Button>
    </div>
  );
}
