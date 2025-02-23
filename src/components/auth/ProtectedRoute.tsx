
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const authChecked = useRef(false);
  const lastPath = useRef(window.location.pathname);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip check if we've already verified auth and we're just navigating internally
      if (authChecked.current && lastPath.current !== window.location.pathname) {
        lastPath.current = window.location.pathname;
        setIsChecking(false);
        return;
      }

      try {
        if (!loading) {
          if (!session) {
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();
            
            if (error || !currentSession) {
              console.log("No session found, redirecting to auth");
              toast.error("Please sign in to access this page");
              navigate("/auth");
              return;
            }
          }
          authChecked.current = true;
          lastPath.current = window.location.pathname;
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("Authentication error. Please try again.");
        navigate("/auth");
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      // Don't reset authChecked on internal navigation
      if (lastPath.current === window.location.pathname) {
        authChecked.current = false;
      }
    };
  }, [session, loading, navigate]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 w-[80%] max-w-[800px]">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return session ? <>{children}</> : null;
};
