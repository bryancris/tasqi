
import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRedirect = useCallback(() => {
    if (!loading && !session && location.pathname !== '/auth') {
      console.log('Redirecting to auth page from:', location.pathname);
      toast.error("Please sign in to access this page");
      navigate("/auth", { 
        replace: true,
        state: { from: location.pathname } 
      });
    }
  }, [session, loading, navigate, location.pathname]);

  useEffect(() => {
    handleRedirect();
  }, [handleRedirect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 w-[80%] max-w-[800px]">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  return session ? children : null;
};
