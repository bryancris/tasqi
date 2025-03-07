
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

      // Set the auth success flag
      window.localStorage.setItem('auth_success', 'true');
      console.log("Auth success flag set in localStorage");
      
      // For extra safety - ensure the session is explicitly set
      if (data.session) {
        // First, ensure the session is properly stored by explicitly setting it
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        
        // Add a small delay to allow Supabase to process the auth state change
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirect to dashboard
        navigate("/dashboard", { replace: true });
      } else {
        // This should rarely happen but just in case
        console.warn("Sign in successful but no session provided by Supabase");
        
        // Try to get the session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          navigate("/dashboard", { replace: true });
        } else {
          // Last resort - navigate but display a message
          navigate("/dashboard", { replace: true });
          toast.warning("Authentication state uncertain. You may need to sign in again if you see any issues.");
        }
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
