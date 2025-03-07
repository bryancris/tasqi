
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "@/components/ui/spinner";
import { isDevelopmentMode } from "@/contexts/auth/provider/constants";

// Maximum wait time before forcing redirect
const MAX_WAIT_TIME = isDevelopmentMode() ? 5000 : 3000;

export const ProtectedRoute = () => {
  const { session, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  
  // Check if dev mode auth bypass is enabled
  const isAuthBypassed = (() => {
    try {
      return isDevelopmentMode() && 
             sessionStorage.getItem('dev_bypass_auth') === 'true';
    } catch (e) {
      return false;
    }
  })();
  
  // In dev mode with bypass enabled, render children immediately
  if (isDevelopmentMode() && isAuthBypassed) {
    console.log("[ProtectedRoute] Dev mode with auth bypass enabled, skipping protection");
    return <Outlet />;
  }
  
  // If we've been waiting for a really long time, show different message
  useEffect(() => {
    if (loading && !initialized && !waitingTooLong) {
      const timeoutId = setTimeout(() => {
        setWaitingTooLong(true);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, initialized, waitingTooLong]);
  
  // Effect to handle the actual redirection
  useEffect(() => {
    // If already redirecting, do nothing
    if (redirectInProgress) return;
    
    // Wait for auth to be initialized or loading to complete
    if (loading && !initialized) {
      // After maximum wait time, redirect to auth
      const timeoutId = setTimeout(() => {
        console.log("[ProtectedRoute] Auth timed out after maximum wait time, redirecting to auth");
        setRedirectInProgress(true);
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }, MAX_WAIT_TIME);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Auth is initialized, check session
    if (!loading || initialized) {
      if (session) {
        // Has session, render normally (no redirect needed)
        console.log("[ProtectedRoute] Session found, allowing access");
        return;
      } else {
        // No session, redirect to auth
        console.log("[ProtectedRoute] No session found, redirecting to auth");
        setRedirectInProgress(true);
        
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }
    }
  }, [session, loading, initialized, navigate, location.pathname, redirectInProgress]);

  // Show loading spinner while checking auth
  if ((loading && !initialized) || (!session && !redirectInProgress)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">
            {waitingTooLong 
              ? "Still verifying your account... taking longer than usual" 
              : "Verifying your account..."}
          </p>
          {waitingTooLong && (
            <p className="text-xs text-slate-500 max-w-md text-center mt-2">
              If this persists, try refreshing the page or clearing your browser storage.
            </p>
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
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-slate-400">Redirecting to login...</p>
      </div>
    </div>
  );
};
