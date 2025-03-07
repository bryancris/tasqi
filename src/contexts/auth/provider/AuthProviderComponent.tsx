
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "../AuthContext";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";
import { supabase } from "@/integrations/supabase/client";

export const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Refs
  const mounted = useRef(true);
  const hasToastRef = useRef(false);
  const authSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  
  // Network status
  const { isOnline } = useNetworkDetection();

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (mounted.current) {
        setSession(null);
        setUser(null);
        hasToastRef.current = false;
        toast.success("Successfully signed out");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  // Initialize auth once on mount
  useEffect(() => {
    console.log("Auth provider initializing");
    
    // Set up auth state subscription
    const setupAuth = async () => {
      try {
        // First check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setAuthError(sessionError);
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        // Update state with session if it exists
        if (sessionData?.session) {
          console.log("Found existing session during initialization");
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          
          // Show success toast (only once)
          if (!hasToastRef.current) {
            toast.success("Successfully signed in", {
              id: "auth-success",
              duration: 3000,
            });
            hasToastRef.current = true;
          }
        } else {
          console.log("No session found during initialization");
        }
        
        // Complete initialization regardless of session existence
        setLoading(false);
        setInitialized(true);
        
        // Set up auth state change listener
        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log(`Auth state change event: ${event}`);
          
          if (!mounted.current) return;
          
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            hasToastRef.current = false;
          } 
          else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && newSession) {
            console.log("Setting session from auth state change", event);
            setSession(newSession);
            setUser(newSession.user);
            
            // Show success toast (only once)
            if (!hasToastRef.current) {
              toast.success("Successfully signed in", {
                id: "auth-success",
                duration: 3000,
              });
              hasToastRef.current = true;
            }
          }
        });
        
        // Store subscription for cleanup
        authSubscription.current = data.subscription;
        
      } catch (error) {
        console.error("Error setting up auth:", error);
        if (error instanceof Error) {
          setAuthError(error);
        }
        setLoading(false);
        setInitialized(true);
      }
    };
    
    // Start auth setup
    setupAuth();
    
    // Cleanup on unmount
    return () => {
      mounted.current = false;
      
      if (authSubscription.current) {
        console.log("Cleaning up auth subscription");
        authSubscription.current.unsubscribe();
      }
    };
  }, []);
  
  // Handle connectivity changes
  useEffect(() => {
    // When coming back online, refresh auth if we have a session
    if (isOnline && initialized && session) {
      console.log("Network reconnected, refreshing auth state");
      const refreshSession = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
          } else {
            // Session lost
            setSession(null);
            setUser(null);
            hasToastRef.current = false;
          }
        } catch (error) {
          console.error("Error refreshing session after reconnect:", error);
        }
      };
      
      refreshSession();
    }
  }, [isOnline, initialized, session]);

  // Create the context value
  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      initialized,
      error: authError,
      handleSignOut,
    }),
    [session, user, loading, initialized, authError]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
