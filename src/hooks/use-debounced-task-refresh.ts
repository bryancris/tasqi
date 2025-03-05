
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useDebouncedTaskRefresh() {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const invalidateTasks = useCallback((delay: number = 300) => {
    console.log(`Scheduling task refresh with ${delay}ms delay`);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Executing delayed task refresh');
      
      // Invalidate both tasks and weekly-tasks
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] })
      ]).then(() => {
        console.log('All task queries invalidated successfully');
      }).catch(error => {
        console.error('Error invalidating task queries:', error);
      });
      
      timeoutRef.current = null;
    }, delay);
  }, [queryClient]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { invalidateTasks, cleanup };
}
