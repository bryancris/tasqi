
import { MutableRefObject } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Maximum refresh attempts before giving up
const MAX_REFRESH_ATTEMPTS = 3;
let refreshAttempts = 0;

// Simplified function to refresh auth state with a single request
export const refreshAuth = async (
  mounted: MutableRefObject<boolean>,
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void,
  hasToastRef: MutableRefObject<boolean>
) => {
  if (!mounted.current) return;
  
  // Prevent multiple simultaneous refresh attempts
  if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
    console.log(`Max refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached. Giving up.`);
    clearAuthState(mounted, setSession, setUser, hasToastRef);
    setLoading(false);
    return;
  }
  
  refreshAttempts++;
  
  try {
    console.log(`Refreshing auth state (attempt ${refreshAttempts})...`);
    setLoading(true);
    
    // Get current session with a single request (includes user data)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      throw error;
    }
    
    // Current session from the response
    const currentSession = data?.session;
    
    // Update state with what we found
    if (mounted.current) {
      if (currentSession) {
        console.log("Session found during refresh, updating state");
        
        // Validate token hasn't expired
        const now = Math.floor(Date.now() / 1000);
        if (currentSession.expires_at && currentSession.expires_at < now) {
          console.log("Session token expired, trying to refresh token");
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.error("Token refresh failed:", refreshError);
            throw new Error("Your session has expired. Please sign in again.");
          }
          
          // Use the refreshed session
          setSession(refreshData.session);
          setUser(refreshData.session.user);
        } else {
          // Use the current valid session
          setSession(currentSession);
          setUser(currentSession.user);
        }
        
        // Show toast only once after successful authentication
        if (!hasToastRef.current) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
          hasToastRef.current = true;
        }
        
        // Reset refresh attempts on success
        refreshAttempts = 0;
      } else {
        // No session found
        console.log("No session found during refresh, clearing state");
        clearAuthState(mounted, setSession, setUser, hasToastRef);
      }
    }
  } catch (error) {
    console.error("Error refreshing auth state:", error);
    if (mounted.current) {
      clearAuthState(mounted, setSession, setUser, hasToastRef);
      
      // Only show error toast if we've reached max attempts
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        toast.error("Authentication error. Please sign in again.");
      }
    }
  } finally {
    // Always update loading state when done if component is still mounted
    if (mounted.current) {
      console.log("Auth refresh complete, setting loading to false");
      setLoading(false);
    }
  }
};

// Helper to clear auth state
export const clearAuthState = (
  mounted: MutableRefObject<boolean>,
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  hasToastRef: MutableRefObject<boolean>
) => {
  if (mounted.current) {
    console.log("Clearing auth state");
    setSession(null);
    setUser(null);
    hasToastRef.current = false;
    refreshAttempts = 0;
  }
};
