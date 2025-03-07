
import { useState, useEffect } from "react";
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

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [showReset, setShowReset] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const { session, loading, initialized, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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
    
    // Check for auth success flag from localStorage immediately on mount
    const authSuccess = window.localStorage.getItem('auth_success');
    if (authSuccess === 'true' && !session && initialized && !isCheckingSession) {
      console.log("Auth success flag found, forcing session check");
      setIsCheckingSession(true);
      
      // Force a session refresh with a more robust approach
      const checkSession = async () => {
        try {
          console.log("Performing thorough session check");
          
          // First try refreshing the session
          const refreshResult = await supabase.auth.refreshSession();
          console.log("Session refresh result:", refreshResult.data.session ? "Session found" : "No session");
          
          // Then get current session
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            console.log("Found valid session after check, redirecting to dashboard");
            window.localStorage.removeItem('auth_success');
            
            // Add a small delay to ensure context is updated
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 200);
          } else {
            console.log("No session found after thorough check");
            window.localStorage.removeItem('auth_success');
          }
        } catch (err) {
          console.error("Error checking session:", err);
        } finally {
          setIsCheckingSession(false);
        }
      };
      
      checkSession();
    }
  }, [session, loading, initialized, location.pathname, navigate, isCheckingSession]);
  
  // If we have a confirmed session, redirect to dashboard
  useEffect(() => {
    if (session) {
      console.log("Auth page: Session exists, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  // If still loading auth state or checking session, show loading indicator
  if ((loading && !initialized) || isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If we have a confirmed session, show a redirect message
  if (session) {
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Redirecting to dashboard...</p>
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
