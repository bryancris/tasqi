
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";

/**
 * This hook synchronizes auth state with task queries
 * It will invalidate tasks when auth state changes
 */
export function useAuthSync() {
  const { user, session, initialized } = useAuth();
  const queryClient = useQueryClient();
  
  // When auth state changes, invalidate task queries
  useEffect(() => {
    if (initialized) {
      const hasAuth = !!user || !!session;
      
      console.log(`Auth state synchronized: User authenticated: ${hasAuth ? 'YES' : 'NO'}`);
      
      // Invalidate all task queries to force a refresh
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-tasks'] });
    }
  }, [user, session, initialized, queryClient]);
  
  return null;
}
