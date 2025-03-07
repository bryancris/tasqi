
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
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [manualCheckComplete, setManualCheckComplete] = useState(false);
  
  // First, handle the case where we have a session already
  useEffect(() => {
    console.log("ProtectedRoute mounted with session state:", 
                !!session, 
                "loading:", loading, 
                "initialized:", initialized);
    
    if (session) {
      // We already have a session, no need to check further
      console.log("ProtectedRoute: Valid session exists, allowing access");
      return;
    }
    
    // We'll perform a manual check if auth is taking too long
    if (loading && !manualCheckComplete && !isCheckingSession) {
      const timeoutId = setTimeout(() => {
        console.log("ProtectedRoute: Auth taking too long, performing manual session check");
        performManualSessionCheck();
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [session, loading, initialized]);
  
  // If we don't have a session after initialization, redirect to auth
  useEffect(() => {
    if (!loading && !isCheckingSession && initialized && !session && manualCheckComplete) {
      // If we have the auth success flag but no session, try one last check
      const authSuccess = window.localStorage.getItem('auth_success');
      
      if (authSuccess === 'true' && checkAttempts < 2) {
        console.log("ProtectedRoute: Auth success flag found but no session in context, performing final check");
        setIsCheckingSession(true);
        setCheckAttempts(prev => prev + 1);
        
        finalSessionCheck();
      } else {
        // No session and no auth flag or exceeded attempts, redirect to auth
        console.log("ProtectedRoute: No session found, redirecting to auth");
        window.localStorage.removeItem('auth_success');
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }
    }
  }, [session, loading, initialized, navigate, location.pathname, isCheckingSession, checkAttempts, manualCheckComplete]);

  // Manual session check function for when auth is taking too long
  const performManualSessionCheck = async () => {
    try {
      console.log("ProtectedRoute: Performing manual session check");
      setIsCheckingSession(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        console.log("ProtectedRoute: Manual check found valid session");
        // We'll let the AuthProvider handle setting the session
        // Just wait for the next render cycle
      } else {
        console.log("ProtectedRoute: Manual check found no session");
        // Continue with redirect on next cycle
      }
    } catch (error) {
      console.error("ProtectedRoute: Error in manual session check", error);
    } finally {
      setIsCheckingSession(false);
      setManualCheckComplete(true);
    }
  };
  
  // Final session check as a last resort
  const finalSessionCheck = async () => {
    try {
      // Use the refresh session API which is more reliable
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (data?.session) {
        console.log("ProtectedRoute: Found session after refresh");
        // Force a refresh to ensure we get the updated session
        window.location.reload();
        return;
      } 
      
      // If we still don't have a session, redirect to auth
      console.log("ProtectedRoute: No session found after final check, redirecting to auth");
      window.localStorage.removeItem('auth_success');
      navigate("/auth", { 
        replace: true,
        state: { from: location.pathname } 
      });
    } catch (error) {
      console.error("Error in final session check:", error);
      toast.error("Authentication error. Please sign in again.");
      window.localStorage.removeItem('auth_success');
      navigate("/auth", { 
        replace: true,
        state: { from: location.pathname } 
      });
    } finally {
      setIsCheckingSession(false);
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
