
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
      
      // Explicitly refresh session to ensure it's stored correctly
      if (data.session) {
        try {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          
          // Short delay to allow auth state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Navigate to dashboard
          navigate("/dashboard", { replace: true });
          return true;
        } catch (e) {
          console.error("[useEmailSignIn] Error setting session:", e);
          // Try to navigate anyway
          navigate("/dashboard", { replace: true });
          return true;
        }
      } else {
        console.warn("[useEmailSignIn] Sign in successful but no session provided");
        
        // Try to get the session explicitly
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            navigate("/dashboard", { replace: true });
            return true;
          } else {
            // As a last resort, force reload
            window.location.href = "/dashboard";
            return true;
          }
        } catch (e) {
          console.error("[useEmailSignIn] Error getting session after sign in:", e);
          navigate("/dashboard", { replace: true });
          return true;
        }
      }
    } catch (error: any) {
      console.error("[useEmailSignIn] Sign in error:", error);
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
