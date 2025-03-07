
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = () => {
  const { session, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  
  // Redirect to login if no session
  useEffect(() => {
    if (!loading && !isCheckingSession && initialized && !session) {
      // If we have the auth success flag but no session, try one last check
      const authSuccess = window.localStorage.getItem('auth_success');
      
      if (authSuccess === 'true' && checkAttempts < 2) {
        console.log("ProtectedRoute: Auth success flag found but no session in context, performing final check");
        setIsCheckingSession(true);
        setCheckAttempts(prev => prev + 1);
        
        const finalSessionCheck = async () => {
          try {
            // Use the refresh session API which is more reliable
            const { data } = await supabase.auth.refreshSession();
            
            if (data?.session) {
              console.log("ProtectedRoute: Found session after refresh");
              setIsCheckingSession(false);
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
            window.localStorage.removeItem('auth_success');
            navigate("/auth", { 
              replace: true,
              state: { from: location.pathname } 
            });
          } finally {
            setIsCheckingSession(false);
          }
        };
        
        finalSessionCheck();
      } else {
        // No session and no auth flag or exceeded attempts, redirect to auth
        console.log("ProtectedRoute: No session found, redirecting to auth");
        navigate("/auth", { 
          replace: true,
          state: { from: location.pathname } 
        });
      }
    }
  }, [session, loading, initialized, navigate, location.pathname, isCheckingSession, checkAttempts]);

  // Show loading spinner while checking auth
  if (loading || isCheckingSession || !initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-slate-400">Verifying your account...</p>
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
