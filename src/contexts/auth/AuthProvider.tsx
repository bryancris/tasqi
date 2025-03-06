
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { refreshAuth, clearAuthState } from "./authUtils";
import { useNetworkDetection } from "@/hooks/chat/use-network-detection";

// Debounce period for auth state updates
const AUTH_DEBOUNCE_MS = 300;
// Maximum time to wait for auth to complete
const AUTH_TIMEOUT_MS = 5000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasToastRef = useRef(false);
  const mounted = useRef(true);
  const authInitialized = useRef(false);
  
  // Tracking flags
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);
  const authStateSubscription = useRef<{ unsubscribe: () => void } | null>(null);
  const refreshAttemptCount = useRef(0);
  const maxRefreshAttempts = 3;
  
  // Network status
  const { isOnline } = useNetworkDetection();

  // Clean sign out function
  const handleSignOut = useCallback(async () => {
    try {
      console.log("Signing out...");
      setLoading(true);
      
      // Unsubscribe from auth state first to prevent extra callbacks during signout
      if (authStateSubscription.current) {
        authStateSubscription.current.unsubscribe();
        authStateSubscription.current = null;
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear auth state
      clearAuthState(mounted, setSession, setUser, hasToastRef);
      
      // Reset refresh attempt counter
      refreshAttemptCount.current = 0;
      console.log("Sign out complete");
      
      // Show success toast
      toast.success("Successfully signed out");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);
  
  // Helper function to handle auth state updates with debouncing
  const updateAuthState = useCallback((newSession: Session | null) => {
    const now = Date.now();
    
    // Debounce rapidly firing auth updates
    if (now - lastRefreshTime.current < AUTH_DEBOUNCE_MS) {
      console.log('Debouncing auth update');
      return;
    }
    
    lastRefreshTime.current = now;
    
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
      setLoading(false);
      
      // Show success toast on sign in (only once)
      if (!hasToastRef.current) {
        toast.success("Successfully signed in", {
          id: "auth-success",
          duration: 3000,
        });
        hasToastRef.current = true;
      }
    } else {
      // No session found
      clearAuthState(mounted, setSession, setUser, hasToastRef);
      setLoading(false);
    }
  }, []);

  // Setup auth subscription only once
  const setupAuthSubscription = useCallback(() => {
    // Never setup twice
    if (authStateSubscription.current) return;

    console.log("Setting up auth state subscription");
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`Auth state change event: ${event}, hasSession: ${!!newSession}`);
      
      if (!mounted.current) return;
      
      if (event === 'SIGNED_OUT') {
        clearAuthState(mounted, setSession, setUser, hasToastRef);
        console.log("Signed out, auth state cleared");
        setLoading(false);
        refreshAttemptCount.current = 0;
      } 
      else if (event === 'SIGNED_IN' && newSession) {
        updateAuthState(newSession);
      } 
      else if (event === 'TOKEN_REFRESHED' && newSession) {
        console.log('Token refreshed successfully');
        updateAuthState(newSession);
      } 
      else if (event === 'USER_UPDATED' && newSession) {
        console.log('User updated');
        updateAuthState(newSession);
      }
      else if (event === 'INITIAL_SESSION') {
        // Handle initial session check
        if (newSession) {
          console.log("Initial session found");
          updateAuthState(newSession);
        } else {
          console.log("No initial session found");
          clearAuthState(mounted, setSession, setUser, hasToastRef);
          setLoading(false);
        }
        
        // Mark as initialized
        authInitialized.current = true;
      }
    });
    
    // Store the subscription for cleanup
    authStateSubscription.current = data.subscription;
    
    // Set a timeout to ensure we don't get stuck in loading
    setTimeout(() => {
      if (mounted.current && loading) {
        console.log("Auth initialization timed out, forcing to not loading");
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);
    
    return data.subscription;
  }, [loading, updateAuthState]);

  // Perform initial auth check on mount
  useEffect(() => {
    console.log("Auth provider initialized");
    
    // Setup auth subscription
    setupAuthSubscription();
    
    // Force loading to false after a timeout
    const timeoutId = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);
    
    // Cleanup function
    return () => {
      console.log("Auth provider unmounting");
      mounted.current = false;
      clearTimeout(timeoutId);
      
      // Cleanup auth subscription
      if (authStateSubscription.current) {
        console.log("Unsubscribing from auth state");
        authStateSubscription.current.unsubscribe();
        authStateSubscription.current = null;
      }
    };
  }, [setupAuthSubscription]);
  
  // Handle network reconnection - refresh auth if needed
  useEffect(() => {
    if (isOnline && !session && authInitialized.current) {
      console.log("Network reconnected, refreshing auth");
      refreshAuth(mounted, setSession, setUser, setLoading, hasToastRef);
    }
  }, [isOnline, session]);

  const contextValue = useMemo(
    () => ({
      session,
      user,
      loading,
      handleSignOut,
    }),
    [session, user, loading, handleSignOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
