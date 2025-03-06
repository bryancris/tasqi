import { useCallback, useRef, useEffect } from "react";

type DebounceProps = {
  debounceTime: number;
  isDevelopment?: boolean;
};

/**
 * Hook to handle debouncing of auth state updates
 */
export const useAuthDebounce = ({ debounceTime }: DebounceProps) => {
  const lastRefreshTime = useRef(0);
  const pendingUpdates = useRef<NodeJS.Timeout | null>(null);
  const debugCount = useRef(0);

  // Clean up any pending timeouts
  useEffect(() => {
    return () => {
      if (pendingUpdates.current) {
        clearTimeout(pendingUpdates.current);
        pendingUpdates.current = null;
      }
    };
  }, []);

  const shouldDebounce = useCallback((now: number): boolean => {
    return now - lastRefreshTime.current < debounceTime;
  }, [debounceTime]);

  const debouncedUpdate = useCallback(<T>(
    updateFn: (data: T) => void,
    data: T
  ): void => {
    const now = Date.now();
    
    // Cancel any pending updates
    if (pendingUpdates.current) {
      clearTimeout(pendingUpdates.current);
      pendingUpdates.current = null;
    }

    // If we need to debounce, schedule an update for later
    if (shouldDebounce(now)) {
      debugCount.current++;
      console.log(`Debouncing auth update #${debugCount.current} (${debounceTime}ms)`);
      
      pendingUpdates.current = setTimeout(() => {
        console.log(`Processing debounced auth update #${debugCount.current}`);
        lastRefreshTime.current = Date.now();
        updateFn(data);
      }, debounceTime);
      
      return;
    }
    
    // Otherwise, update immediately
    lastRefreshTime.current = now;
    updateFn(data);
  }, [debounceTime, shouldDebounce]);

  return {
    debouncedUpdate,
    clearPendingUpdates: useCallback(() => {
      if (pendingUpdates.current) {
        clearTimeout(pendingUpdates.current);
        pendingUpdates.current = null;
      }
    }, [])
  };
};
