
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for debounced task query invalidation to prevent excessive refetching
 * while ensuring UI stays updated
 */
export function useDebouncedTaskRefresh() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const invalidateTasks = useCallback((delay: number = 250) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set refreshing flag to prevent duplicate refreshes
    if (isRefreshingRef.current) {
      console.log('Task refresh already in progress, skipping...');
      return;
    }
    
    isRefreshingRef.current = true;
    console.log(`Scheduling task refresh with ${delay}ms delay`);
    
    // Schedule the refresh
    timeoutRef.current = setTimeout(() => {
      console.log('Executing debounced task refresh');
      
      Promise.all([
        // Invalidate all task-related queries at once
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] })
      ])
      .then(() => {
        console.log('Task queries successfully invalidated');
        // Reset after a small delay to prevent immediate re-triggering
        setTimeout(() => {
          isRefreshingRef.current = false;
          timeoutRef.current = null;
        }, 100);
      })
      .catch(error => {
        console.error('Error refreshing tasks:', error);
        isRefreshingRef.current = false;
        timeoutRef.current = null;
      });
    }, delay);
  }, [queryClient]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isRefreshingRef.current = false;
  }, []);

  return { invalidateTasks, cleanup };
}
