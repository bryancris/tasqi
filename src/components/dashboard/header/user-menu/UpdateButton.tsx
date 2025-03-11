import { RefreshCw } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useRef, useEffect } from "react";

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
    
    if (isChecking) {
      return;
    }
    
    try {
      setIsChecking(true);
      
      const toastId = toast.loading('Checking for updates...', {
        id: 'update-check',
      });
      
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
      
      checkTimeoutRef.current = window.setTimeout(() => {
        toast.dismiss('update-check');
        toast.error('Update check timed out', { id: 'update-timeout' });
        setIsChecking(false);
        console.log('Update check timed out after 10 seconds');
      }, 10000);
      
      console.log('Checking for updates...');
      await updateServiceWorker(true);
      
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      
      toast.dismiss('update-check');
      
      if (needRefresh) {
        toast.success('Update available. Applying now...', {
          id: 'update-available',
          duration: 3000,
          onAutoClose: () => {
            window.location.reload();
          }
        });
      } else {
        toast.success('You have the latest version!', {
          id: 'update-check-result'
        });
      }
    } catch (error) {
      console.error('Update check failed:', error);
      
      toast.dismiss('update-check');
      
      toast.error('Failed to check for updates', {
        id: 'update-error'
      });
    } finally {
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      
      setIsChecking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        window.clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

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
