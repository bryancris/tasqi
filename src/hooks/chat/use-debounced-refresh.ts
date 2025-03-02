
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback, useEffect } from "react";

export function useDebouncedRefresh() {
  const queryClient = useQueryClient();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, []);

  const debouncedRefresh = useCallback((queryKey: string[], delay: number = 500) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        queryClient.invalidateQueries({ queryKey });
        console.log(`✅ ${queryKey[0]} list refreshed`);
      }
      refreshTimeoutRef.current = null;
    }, delay);
  }, [queryClient]);

  return { debouncedRefresh, isMountedRef };
}
