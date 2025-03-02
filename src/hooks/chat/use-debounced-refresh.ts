
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback, useEffect } from "react";

export function useDebouncedRefresh() {
  const queryClient = useQueryClient();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const pendingRefreshesRef = useRef<Map<string, boolean>>(new Map());
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      
      // Clean up any pending timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      // Clear the pending refreshes map
      pendingRefreshesRef.current.clear();
    };
  }, []);

  const debouncedRefresh = useCallback((queryKey: string[], delay: number = 500) => {
    // Convert query key to string for storage in map
    const queryKeyStr = queryKey.join('-');
    
    // Skip if this exact refresh is already pending
    if (pendingRefreshesRef.current.get(queryKeyStr)) {
      console.log(`Skipping duplicate refresh for ${queryKeyStr}`);
      return;
    }
    
    // Mark this refresh as pending
    pendingRefreshesRef.current.set(queryKeyStr, true);
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log(`🔄 Refreshing ${queryKey[0]} list (debounced)`);
        queryClient.invalidateQueries({ queryKey })
          .then(() => {
            console.log(`✅ ${queryKey[0]} list refreshed`);
          })
          .catch(error => {
            console.error(`❌ Error refreshing ${queryKey[0]} list:`, error);
          })
          .finally(() => {
            // Clear the pending status for this query key
            pendingRefreshesRef.current.delete(queryKeyStr);
          });
      }
      refreshTimeoutRef.current = null;
    }, delay);
  }, [queryClient]);

  return { debouncedRefresh, isMountedRef };
}
