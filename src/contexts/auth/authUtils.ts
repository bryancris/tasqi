
import { MutableRefObject } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Function to refresh auth state
export const refreshAuth = async (
  mounted: MutableRefObject<boolean>,
  setSession: (session: Session | null) => void,
  setUser: (user: User | null) => void,
  setLoading: (loading: boolean) => void,
  hasToastRef: MutableRefObject<boolean>
) => {
  if (!mounted.current) return;
  
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw sessionError;
    
    // Update session state
    const currentSession = sessionData?.session;
    
    if (currentSession) {
      // If we have a session, get user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (mounted.current) {
        setSession(currentSession);
        setUser(userData?.user || null);
        
        // Show toast only once after successful authentication
        if (userData?.user && !hasToastRef.current) {
          toast.success("Successfully signed in", {
            id: "auth-success",
            duration: 3000,
          });
          hasToastRef.current = true;
        }
      }
    } else {
      // No session found
      if (mounted.current) {
        setSession(null);
        setUser(null);
      }
    }
  } catch (error) {
    console.error("Error refreshing auth state:", error);
    if (mounted.current) {
      setSession(null);
      setUser(null);
    }
  } finally {
    // Always update loading state when done
    if (mounted.current) {
      setLoading(false);
    }
  }
};
