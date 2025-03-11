
import { RefreshCw } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState } from "react";

export function UpdateButton({ isStandalone }: { isStandalone: boolean }) {
  const [isChecking, setIsChecking] = useState(false);
  
  const {
    updateServiceWorker,
    needRefresh: [needRefresh],
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
    
    try {
      setIsChecking(true);
      toast.loading('Checking for updates...');
      
      // Force the service worker to check for updates
      await updateServiceWorker(true);
      
      if (needRefresh) {
        toast.success('Update available. Applying now...', {
          duration: 3000,
          onAutoClose: () => {
            window.location.reload();
          }
        });
      } else {
        toast.success('You have the latest version!');
      }
    } catch (error) {
      console.error('Update check failed:', error);
      toast.error('Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

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
