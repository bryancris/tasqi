
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
    
    const setupServiceWorkerListeners = () => {
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
        
        // Setup other listeners for service worker state changes
        if ('serviceWorker' in navigator) {
          // Check if there's already a controlling service worker
          if (navigator.serviceWorker.controller) {
            console.log('Service worker is already controlling the page');
          }
          
          // Handle new service worker installation
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed');
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });
          
          // Get service worker registration to check for updates
          navigator.serviceWorker.ready.then((reg) => {
            console.log('Service worker ready');
            setRegistration(reg);
            
            // Check for updates immediately and then on regular intervals
            const checkForUpdates = async () => {
              console.log('Checking for service worker updates...');
              try {
                await reg.update();
              } catch (error) {
                console.error('Error checking for updates:', error);
              }
            };
            
            // Initial check
            checkForUpdates();
            
            // Check every 30 minutes
            const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);
            
            // Setup update waiting handler
            const handleUpdateFound = () => {
              const newWorker = reg.installing || reg.waiting;
              
              if (newWorker) {
                console.log('New service worker state:', newWorker.state);
                
                newWorker.addEventListener('statechange', () => {
                  console.log('Service worker state changed to:', newWorker.state);
                  
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New service worker installed and waiting');
                    setShowUpdatePrompt(true);
                    setUpdateReady(true);
                    
                    // Also notify via toast
                    toast('Update available', {
                      description: 'A new version is available. Refresh to update.',
                      action: {
                        label: 'Update',
                        onClick: () => applyUpdate()
                      }
                    });
                  }
                });
              }
            };
            
            // Check if an update is already waiting
            if (reg.waiting) {
              console.log('Update already waiting');
              setShowUpdatePrompt(true);
              setUpdateReady(true);
            }
            
            // Listen for future updates
            reg.addEventListener('updatefound', handleUpdateFound);
            
            return () => {
              clearInterval(updateInterval);
              reg.removeEventListener('updatefound', handleUpdateFound);
            };
          });
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
      console.log('Sending SKIP_WAITING message to service worker');
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
  
  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network is online');
      toast.success('You are back online', {
        description: 'Your network connection has been restored.'
      });
      
      // If service worker is registered, check for updates when coming back online
      if (registration) {
        registration.update().catch(err => {
          console.error('Error updating service worker after coming online:', err);
        });
      }
    };
    
    const handleOffline = () => {
      console.log('Network is offline');
      toast.error('You are offline', {
        description: 'Some features may be limited. We\'ll sync your changes when you\'re back online.'
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [registration]);
  
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
