
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("[useGoogleSignIn] Initiating sign in with Google...");
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth',
        }
      });

      if (error) throw error;
      
      console.log("[useGoogleSignIn] Google OAuth started, waiting for redirect");
      
      // No toast here since we're redirecting to Google
      // The auth mechanism will handle redirects after successful auth
      return true;
    } catch (error: any) {
      console.error("[useGoogleSignIn] Google sign in error:", error);
      setAuthError(error);
      toast.error(error.message || "Google sign in failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signInWithGoogle,
    error: authError
  };
}
