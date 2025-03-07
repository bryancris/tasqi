
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

      // Set the auth success flag to help detect successful authentication
      window.localStorage.setItem('auth_success', 'true');
      console.log("[useEmailSignIn] Auth success flag set in localStorage");
      
      // Let the Auth component handle redirection
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
