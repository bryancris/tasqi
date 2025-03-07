
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useEmailSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const navigate = useNavigate();

  const signInWithEmail = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      toast.error(
        !email.trim() 
          ? "Email is required" 
          : "Password is required"
      );
      return false;
    }
    
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("[useEmailSignIn] Initiating sign in with email...");
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("[useEmailSignIn] Sign in successful", 
                 data.session ? "Session exists" : "No session", 
                 "User:", data.user?.email);
      
      // If we got here, authentication succeeded
      toast.success("Sign in successful");
      
      // The auth provider will handle the session update through onAuthStateChange
      
      // Navigate after auth
      setTimeout(() => {
        // Get the location to redirect to (from the router state or default to dashboard)
        const state = window.history.state?.usr;
        const from = state?.from || "/dashboard";
        console.log("[useEmailSignIn] Redirecting to:", from);
        navigate(from, { replace: true });
      }, 300);
      
      return true;
    } catch (error: any) {
      console.error("[useEmailSignIn] Sign in error:", error);
      setAuthError(error);
      toast.error(error.message || "Sign in failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signInWithEmail,
    error: authError
  };
}
