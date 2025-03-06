
import { MutableRefObject } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Simplified function to refresh auth state with a single request
export const refreshAuth = async (
  mounted: MutableRefObject<boolean>,
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void,
  hasToastRef: MutableRefObject<boolean>
) => {
  if (!mounted.current) return;
  
  try {
    console.log("Refreshing auth state...");
    
    // Get current session with a single request (includes user data)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      // Clear auth state on error
      clearAuthState(mounted, setSession, setUser, hasToastRef);
      setLoading(false);
      return;
    }
    
    // Current session from the response
    const currentSession = data?.session;
    
    // Update state with what we found
    if (mounted.current) {
      if (currentSession) {
        console.log("Session found, updating state");
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Show toast only once after successful authentication
        if (!hasToastRef.current) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
          hasToastRef.current = true;
        }
      } else {
        // No session found
        console.log("No session found, clearing state");
        clearAuthState(mounted, setSession, setUser, hasToastRef);
      }
    }
  } catch (error) {
    console.error("Error refreshing auth state:", error);
    if (mounted.current) {
      clearAuthState(mounted, setSession, setUser, hasToastRef);
    }
  } finally {
    // Always update loading state when done
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
  }
};
