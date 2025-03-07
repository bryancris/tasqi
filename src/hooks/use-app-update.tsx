
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useAppUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle messages from service worker
  const handleSWMessage = useCallback((event: MessageEvent) => {
    console.log('Service worker message received:', event.data);

    if (event.data && event.data.type === 'UPDATE_FOUND') {
      setUpdateAvailable(true);
      
      // Dispatch custom event for components that need to know
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sw-update-found'));
      }
      
      toast.info('A new update is available', { id: 'update-available' });
    } else if (event.data && event.data.type === 'ACTIVATED') {
      setIsUpdating(false);
      toast.success('Update activated successfully', { id: 'update-activated' });
      
      // Set a flag to show success message after reload
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_update_status', 'complete');
        
        // Reload after a brief delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  }, []);

  // Setup broadcast channel listener
  useEffect(() => {
    // Only run this effect in browser environments
    if (typeof window === 'undefined') return;

    let cleanup: (() => void) | undefined;

    // Check if broadcast channel is supported
    if ('BroadcastChannel' in window) {
      try {
        const broadcastChannel = new BroadcastChannel('sw-updates');
        
        broadcastChannel.addEventListener('message', handleSWMessage);
        
        cleanup = () => {
          broadcastChannel.removeEventListener('message', handleSWMessage);
          broadcastChannel.close();
        };
      } catch (error) {
        console.error('Error with BroadcastChannel:', error);
        // Fallback if there's an error with BroadcastChannel
        window.addEventListener('message', handleSWMessage);
        cleanup = () => window.removeEventListener('message', handleSWMessage);
      }
    } else {
      // Fallback for browsers without BroadcastChannel
      window.addEventListener('message', handleSWMessage);
      cleanup = () => window.removeEventListener('message', handleSWMessage);
    }
    
    // Return cleanup function
    return cleanup;
  }, [handleSWMessage]);

  // Check for update status on mount
  useEffect(() => {
    // Only run in browser environments
    if (typeof window === 'undefined') return;
    
    const checkUpdateComplete = () => {
      const updateStatus = localStorage.getItem('app_update_status');
      
      if (updateStatus === 'updating') {
        // Still updating
        setIsUpdating(true);
      } else if (updateStatus === 'complete') {
        // Just completed an update
        toast.success('Update successfully installed!');
        localStorage.removeItem('app_update_status');
      }
    };
    
    checkUpdateComplete();
    
    // Also check for updates on mount if not in development
    const checkForUpdatesOnMount = async () => {
      if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.waiting) {
            setUpdateAvailable(true);
          }
        } catch (err) {
          console.error('Error checking for updates on mount:', err);
        }
      }
    };
    
    checkForUpdatesOnMount();
  }, []);

  return {
    isChecking,
    setIsChecking,
    updateAvailable,
    isUpdating
  };
}
