
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useEmailSignIn() {
  const [isLoading, setIsLoading] = useState(false);
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

    try {
      console.log("Initiating sign in with email...");
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log("Sign in successful", data.session ? "Session exists" : "No session", "User:", data.user?.email);
      
      // If we got here, authentication succeeded
      toast.success("Sign in successful");

      // Set the auth success flag as a backup in case the session context isn't updated
      window.localStorage.setItem('auth_success', 'true');
      console.log("Auth success flag set in localStorage");
      
      // For extra safety - ensure the session is explicitly set and refreshed
      if (data.session) {
        // First, ensure the session is properly stored by explicitly setting it
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        // Redirect with a slight delay to allow auth context to update
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 300);
      }
      
      return true;
      
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      toast.error(error.message || "Sign in failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signInWithEmail
  };
}
