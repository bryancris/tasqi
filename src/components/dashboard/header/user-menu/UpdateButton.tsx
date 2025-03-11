
import { RefreshCw } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useRef } from "react";

export function UpdateButton({ isStandalone }: { isStandalone: boolean }) {
  const [isChecking, setIsChecking] = useState(false);
  const checkTimeoutRef = useRef<number | null>(null);
  
  const {
    updateServiceWorker,
    needRefresh: [needRefresh, setNeedRefresh],
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registered:', swUrl);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  const checkForUpdate = async () => {
    if (!isStandalone) {
      return;
    }
    
    // Prevent multiple simultaneous checks
    if (isChecking) {
      return;
    }
    
    try {
      setIsChecking(true);
      
      // Show loading toast with ID so we can dismiss it later
      const toastId = toast.loading('Checking for updates...', {
        id: 'update-check',
      });
      
      // Set a timeout to reset state in case the update check hangs
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
      
      checkTimeoutRef.current = window.setTimeout(() => {
        toast.dismiss('update-check');
        toast.error('Update check timed out', { id: 'update-timeout' });
        setIsChecking(false);
        console.log('Update check timed out after 10 seconds');
      }, 10000); // 10 second timeout
      
      // Force the service worker to check for updates
      console.log('Checking for updates...');
      await updateServiceWorker(true);
      
      // Clear the timeout since check completed
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      
      // Dismiss the loading toast regardless of result
      toast.dismiss('update-check');
      
      if (needRefresh) {
        // If update available, show success toast and reload
        toast.success('Update available. Applying now...', {
          id: 'update-available',
          duration: 3000,
          onAutoClose: () => {
            window.location.reload();
          }
        });
      } else {
        // If no update, show info toast
        toast.success('You have the latest version!', {
          id: 'update-check-result'
        });
      }
    } catch (error) {
      console.error('Update check failed:', error);
      
      // Dismiss the loading toast in case of error
      toast.dismiss('update-check');
      
      toast.error('Failed to check for updates', {
        id: 'update-error'
      });
    } finally {
      // Always reset the checking state and clear timeout
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      
      setIsChecking(false);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Only show this button for installed PWAs
  if (!isStandalone) {
    return null;
  }

  return (
    <DropdownMenuItem 
      onClick={checkForUpdate}
      disabled={isChecking}
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      {isChecking ? 'Checking...' : 'Check for update'}
    </DropdownMenuItem>
  );
}
