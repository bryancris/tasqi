
import { useEffect, useState, useCallback } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Function to handle the actual update process
  const applyUpdate = useCallback(() => {
    if (!registration?.waiting || isUpdating) return;
    
    setIsUpdating(true);
    toast.loading("Installing update...", { id: "sw-updating" });
    
    // Create a listener for the state change to "activated"
    const onStateChange = (event: Event) => {
      if ((event.target as ServiceWorker).state === 'activated') {
        toast.dismiss("sw-updating");
        toast.success("Update installed! Reloading...", { id: "sw-updated" });
        
        // Remove the listener to avoid memory leaks
        (event.target as ServiceWorker).removeEventListener('statechange', onStateChange);
        
        // Reload the page after a brief delay to show the toast
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };
    
    // Add the state change listener
    registration.waiting.addEventListener('statechange', onStateChange);
    
    // Send the message to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Safety timeout in case activation doesn't trigger properly
    setTimeout(() => {
      if (isUpdating) {
        toast.dismiss("sw-updating");
        toast.error("Update failed to activate. Please reload manually.", { id: "sw-update-error" });
        setIsUpdating(false);
      }
    }, 10000);
  }, [registration, isUpdating]);

  // Show update toast when an update is available
  const showUpdateToast = useCallback(() => {
    if (!updateAvailable || isUpdating) return;
    
    toast(
      <div className="flex flex-col gap-2">
        <div className="font-semibold">Update Available</div>
        <div className="text-sm">A new version of the app is available.</div>
        <Button 
          size="sm" 
          className="w-full mt-2"
          onClick={applyUpdate}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Update Now
        </Button>
      </div>,
      {
        duration: Infinity,
        id: "update-available"
      }
    );
  }, [updateAvailable, isUpdating, applyUpdate]);

  useEffect(() => {
    // Get the current registration when component mounts
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(reg => {
          setRegistration(reg);
          
          // Check for waiting service worker (update ready to activate)
          if (reg.waiting) {
            setUpdateAvailable(true);
          }
          
          // Listen for new service workers being installed
          const onUpdateFound = () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;
            
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed and ready to take over
                setUpdateAvailable(true);
              }
            });
          };
          
          // Start listening for updates
          reg.addEventListener('updatefound', onUpdateFound);
          
          // Check for updates periodically (every 30 minutes)
          const checkInterval = setInterval(() => {
            console.log('Checking for service worker updates...');
            reg.update().catch(err => console.error('Error checking for updates:', err));
          }, 30 * 60 * 1000);
          
          return () => {
            reg.removeEventListener('updatefound', onUpdateFound);
            clearInterval(checkInterval);
          };
        })
        .catch(err => console.error('Error getting ServiceWorker registration:', err));
    }
  }, []);

  // Show update notification when update becomes available
  useEffect(() => {
    if (updateAvailable) {
      showUpdateToast();
    }
  }, [updateAvailable, showUpdateToast]);

  // Check for updates on component mount (without UI feedback)
  useEffect(() => {
    if (registration && !updateAvailable) {
      registration.update().catch(err => 
        console.error('Background update check failed:', err)
      );
    }
  }, [registration, updateAvailable]);

  // Handle update completion detection from localStorage
  useEffect(() => {
    const checkUpdateComplete = () => {
      const updateStatus = localStorage.getItem('app_update_status');
      if (updateStatus === 'updating') {
        toast.success('Update successfully installed!', { id: "update-complete" });
        localStorage.removeItem('app_update_status');
      }
    };
    
    checkUpdateComplete();
  }, []);

  // This component doesn't render anything visible
  return null;
}
