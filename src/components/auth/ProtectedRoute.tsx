
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProtectedRoute = () => {
  const { session, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [manualCheckComplete, setManualCheckComplete] = useState(false);
  const [redirectedToAuth, setRedirectedToAuth] = useState(false);
  
  console.log("[ProtectedRoute] Status:", 
    { hasSession: !!session, loading, initialized, path: location.pathname });
  
  // First, handle the case where auth is initialized
  useEffect(() => {
    // If we have a session, allow access
    if (session) {
      console.log("[ProtectedRoute] Valid session exists, allowing access");
      return;
    }
    
    // If auth is fully initialized and no session, redirect
    // Also make sure we don't redirect again if we already did
    if (!loading && initialized && !session && !isCheckingSession && !redirectedToAuth) {
      console.log("[ProtectedRoute] No session found after initialization, redirecting to auth");
      // Clear any stale auth flags
      window.localStorage.removeItem('auth_success');
      setRedirectedToAuth(true);
      
      navigate("/auth", { 
        replace: true,
        state: { from: location.pathname } 
      });
    }
  }, [session, loading, initialized, navigate, location.pathname, isCheckingSession, redirectedToAuth]);
  
  // Add a timeout for manual session check if auth is taking too long
  useEffect(() => {
    // Only check if we're still loading, haven't completed a manual check,
    // aren't currently checking, and haven't redirected yet
    if (loading && !manualCheckComplete && !isCheckingSession && !redirectedToAuth) {
      const timeoutId = setTimeout(() => {
        console.log("[ProtectedRoute] Auth taking too long, performing manual check");
        setIsCheckingSession(true);
        performManualSessionCheck();
      }, 1000); // Reduced timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, isCheckingSession, manualCheckComplete, redirectedToAuth]);
  
  // Manual session check function
  const performManualSessionCheck = async () => {
    try {
      console.log("[ProtectedRoute] Performing manual session check");
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        console.log("[ProtectedRoute] Manual check found valid session");
        // Force a quick reload to update the auth context properly
        window.location.reload();
        return;
      } else {
        console.log("[ProtectedRoute] Manual check found no session");
        
        // No session, redirect to auth - only if we haven't already
        if (!redirectedToAuth) {
          window.localStorage.removeItem('auth_success');
          setRedirectedToAuth(true);
          
          navigate("/auth", { 
            replace: true,
            state: { from: location.pathname } 
          });
        }
      }
    } catch (error) {
      console.error("[ProtectedRoute] Error in manual session check", error);
      
      // Only show toast and redirect if we haven't already
      if (!redirectedToAuth) {
        toast.error("Authentication error. Please sign in again.");
        window.localStorage.removeItem('auth_success');
        setRedirectedToAuth(true);
        
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }
    } finally {
      setIsCheckingSession(false);
      setManualCheckComplete(true);
    }
  };

  // Show loading spinner while checking auth
  if (loading || isCheckingSession || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">Verifying your account...</p>
          {isCheckingSession && (
            <p className="text-xs text-slate-400">Performing additional verification...</p>
          )}
        </div>
      </div>
    );
  }

  // If we have a session, render child routes
  if (session) {
    return <Outlet />;
  }

  // Fallback while redirecting
  return null;
};
