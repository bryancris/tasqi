
import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status more reliably
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' 
      ? navigator.onLine 
      : true
  );

  useEffect(() => {
    const handleOnline = () => {
      console.log("Network connection restored");
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log("Network connection lost");
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if we have connection to Supabase specifically
    const checkConnection = async () => {
      try {
        // Simple health check request
        const response = await fetch("https://mcwlzrikidzgxexnccju.supabase.co/auth/v1/health", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Short timeout
          signal: AbortSignal.timeout(2000),
        });
        
        if (response.ok) {
          console.log("Backend connection verified");
          setIsOnline(true);
        } else {
          console.warn("Backend connection check failed, status:", response.status);
          // Don't force offline here - just log the issue
        }
      } catch (error) {
        console.warn("Backend connection check error:", error);
        // Don't force offline here either - rely on browser events
      }
    };
    
    // Run a connection check on mount
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
