
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [showReset, setShowReset] = useState(false);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const { session, loading, initialized, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const manualCheckAttempted = useRef(false);
  
  // Check if we're on the update password route
  const isUpdatePasswordRoute = location.pathname === "/auth/update-password";
  
  // For debugging
  useEffect(() => {
    console.log("Auth component initial state:", { 
      hasSession: !!session, 
      loading, 
      initialized,
      path: location.pathname
    });
  }, [session, loading, initialized, location.pathname]);
  
  // Add a timeout to force progress if we're stuck loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loading && !isManualChecking && !manualCheckAttempted.current) {
      timeoutId = setTimeout(() => {
        console.log("Auth page: Loading timed out, manually checking session");
        manualCheckAttempted.current = true;
        setIsManualChecking(true);
        
        // Manually check session
        const checkSession = async () => {
          try {
            const { data, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (data?.session) {
              console.log("Auth page: Manual check found session, redirecting");
              // Try to do a refresh as well to update the context
              try {
                await supabase.auth.refreshSession();
              } catch (e) {
                console.warn("Session refresh failed but continuing anyway", e);
              }
              
              // Use a short delay before redirecting to allow time for AuthProvider to update
              setTimeout(() => {
                navigate("/dashboard", { replace: true });
              }, 100);
            } else {
              console.log("Auth page: Manual check found no session");
              // Just let the user see the login screen
              setIsManualChecking(false);
            }
          } catch (error) {
            console.error("Auth page: Manual session check failed", error);
            toast.error("Could not verify authentication state. Please try logging in again.");
            setIsManualChecking(false);
          }
        };
        
        checkSession();
      }, 3000); // 3 seconds timeout
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, navigate, isManualChecking]);
  
  // If we have a confirmed session, redirect to dashboard
  useEffect(() => {
    if (initialized && !loading && session) {
      console.log("Auth page: Session exists, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate, initialized, loading]);

  // If still loading auth state, show loading indicator
  if ((loading && !isManualChecking) || (initialized && session)) {
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">
            {session ? "Redirecting to dashboard..." : "Verifying authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-white">
              {isUpdatePasswordRoute 
                ? "Update Your Password" 
                : showReset 
                  ? "Reset Password" 
                  : "Welcome to TASQI-AI"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Show any auth errors */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || "An authentication error occurred. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            {isUpdatePasswordRoute ? (
              <div className="space-y-4">
                <ResetPasswordForm />
                <Button
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white"
                  onClick={() => navigate("/auth", { replace: true })}
                >
                  Back to login
                </Button>
              </div>
            ) : showReset ? (
              <div className="space-y-4">
                <ResetPasswordForm />
                <Button
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white"
                  onClick={() => setShowReset(false)}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="signin">
                    <SignInForm onResetPassword={() => setShowReset(true)} />
                  </TabsContent>
                  <TabsContent value="signup">
                    <SignUpForm />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default Auth;
