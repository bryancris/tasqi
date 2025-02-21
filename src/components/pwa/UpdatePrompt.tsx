
import { useEffect, useState } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if the browser supports service workers
    if ('serviceWorker' in navigator) {
      // Get the current registration
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);
      });

      // Listen for new service worker installation
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control, reload the page
        window.location.reload();
      });

      // Check for updates every hour
      const interval = setInterval(() => {
        if (registration) {
          registration.update().catch(console.error);
        }
      }, 60 * 60 * 1000);

      // Listen for new updates
      window.addEventListener('sw-update-found', () => {
        setUpdateAvailable(true);
        showUpdateToast();
      });

      return () => {
        clearInterval(interval);
        window.removeEventListener('sw-update-found', () => {});
      };
    }
  }, [registration]);

  const showUpdateToast = () => {
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
      }
    );
  };

  const applyUpdate = () => {
    if (registration && registration.waiting) {
      // Send message to service worker to skip waiting and activate new version
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Add this component to your app, but it doesn't need to render anything visible
  return null;
}
