
import { RefreshCw } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useEffect } from "react";

interface UpdateButtonProps {
  isChecking: boolean;
  setIsChecking: (checking: boolean) => void;
}

export function UpdateButton({ isChecking, setIsChecking }: UpdateButtonProps) {
  // Clear any stale "checking" toast on unmount
  useEffect(() => {
    return () => {
      toast.dismiss("update-check");
    };
  }, []);

  const handleUpdate = async () => {
    if (isChecking) {
      toast.info('Already checking for updates...', { id: "update-check" });
      return;
    }

    try {
      setIsChecking(true);
      toast.loading('Checking for updates...', { id: "update-check" });

      // Set timeout to prevent endless "checking" state
      const updateTimeout = setTimeout(() => {
        toast.dismiss("update-check");
        toast.error('Update check timed out. Please try again.', { id: "update-error" });
        setIsChecking(false);
      }, 15000); // 15 seconds timeout

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Add state change listener before updating
        const stateChangeListener = () => {
          if (registration.waiting) {
            clearTimeout(updateTimeout);
            toast.dismiss("update-check");
            toast.success('Update found! Installing...', {
              duration: 3000,
              id: "update-success"
            });

            localStorage.setItem('app_update_status', 'updating');

            // Send message to activate the waiting service worker
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Show a completion toast after a short delay
            setTimeout(() => {
              toast.success('Update complete! Reloading app...', {
                duration: 2000,
                id: "update-complete"
              });
              
              // Reload the page to activate the new service worker
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }, 1000);
          }
        };

        // Add state change listener to detect when installing completes
        if (registration.installing) {
          registration.installing.addEventListener('statechange', (event) => {
            if ((event.target as ServiceWorker).state === 'installed') {
              stateChangeListener();
            }
          });
        }

        // Manually check for updates
        await registration.update();
        
        // If there's already a waiting service worker, trigger update
        if (registration.waiting) {
          stateChangeListener();
          return;
        }

        // If no update found after a brief check
        setTimeout(() => {
          if (!registration.waiting && !registration.installing) {
            clearTimeout(updateTimeout);
            toast.dismiss("update-check");
            toast.success('Your app is up to date!', { id: "update-status" });
            setIsChecking(false);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating app:', error);
      toast.error('Failed to check for updates', { id: "update-error" });
      setIsChecking(false);
    }
  };

  return (
    <DropdownMenuItem onClick={handleUpdate} disabled={isChecking}>
      <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
      {isChecking ? 'Checking for Updates...' : 'Check for Updates'}
    </DropdownMenuItem>
  );
}
