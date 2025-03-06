
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

const Auth = () => {
  const [activeTab, setActiveTab] = useState("signin");
  const [showReset, setShowReset] = useState(false);
  const [forceReady, setForceReady] = useState(false);
  const { session, loading, initialized, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add ref to track mounting time
  const mountTime = useRef(Date.now());
  
  // Check if we're on the update password route
  const isUpdatePasswordRoute = location.pathname === "/auth/update-password";
  
  // Force the loading state to end after a shorter timeout in development
  // to prevent infinite loading
  useEffect(() => {
    if (loading && !initialized) {
      const isDev = process.env.NODE_ENV === 'development' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
      
      const timeoutDuration = isDev ? 2500 : 4000;
      
      console.log(`Auth page: Setting force ready timeout for ${timeoutDuration}ms`);
      
      const timer = setTimeout(() => {
        console.log("Auth loading timeout reached, forcing ready state");
        setForceReady(true);
      }, timeoutDuration);
      
      return () => clearTimeout(timer);
    }
  }, [loading, initialized]);
  
  // Only redirect when we have a confirmed session and loading is complete
  useEffect(() => {
    if (session && (!loading || initialized || forceReady)) {
      console.log("Auth page: Session exists, redirecting to dashboard");
      // Use a slight delay to allow state to settle
      const redirectTimer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [session, loading, initialized, forceReady, navigate]);

  // For debugging
  useEffect(() => {
    console.log("Auth page state:", { 
      loading, 
      initialized, 
      forceReady, 
      hasSession: !!session,
      hasError: !!error,
      timeOnPage: Date.now() - mountTime.current
    });
    
    // Force ready state if we've been on this page too long
    const MAX_TIME_ON_AUTH_PAGE = 5000; // 5 seconds
    const timeSinceMounted = Date.now() - mountTime.current;
    
    if (loading && !initialized && !forceReady && timeSinceMounted > MAX_TIME_ON_AUTH_PAGE) {
      console.log(`Auth page: Been on page for ${timeSinceMounted}ms, forcing ready state`);
      setForceReady(true);
    }
  }, [loading, initialized, forceReady, session, error]);

  // If we've been stuck in loading state for too long, force show the auth UI
  const shouldShowAuthForm = forceReady || !loading || initialized;

  // If we're still loading and haven't timed out and aren't initialized, show loading state
  if ((loading && !forceReady && !initialized) || (initialized && loading && !forceReady)) {
    console.log("Auth page: Still loading authentication state");
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Verifying authentication...</p>
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="ghost" 
              className="text-white/50 text-xs mt-4 hover:text-white"
              onClick={() => setForceReady(true)}
            >
              Continue without waiting (dev only)
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // If we have a confirmed session, show a redirect message
  if (session) {
    console.log("Auth page: Confirmed session, showing redirect message");
    return (
      <div className="min-h-screen bg-[#1a1b3b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-white" />
          <p className="text-white/70">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  console.log("Auth page: Rendering authentication UI");
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
            
            {shouldShowAuthForm && (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

export default Auth;
