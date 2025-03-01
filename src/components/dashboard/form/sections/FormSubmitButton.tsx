
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FormSubmitButtonProps {
  isLoading: boolean;
  processingAIResponse: boolean;
  isEditing: boolean;
  isMobile: boolean;
}

export function FormSubmitButton({ 
  isLoading, 
  processingAIResponse, 
  isEditing, 
  isMobile 
}: FormSubmitButtonProps) {
  const { session, user, loading } = useAuth();
  const [directAuthCheck, setDirectAuthCheck] = useState<boolean | null>(null);
  
  // Add a direct auth check as a backup
  useEffect(() => {
    const checkAuthDirectly = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const isDirectlyAuthenticated = !!data.user;
        console.log("Direct auth check:", { 
          isAuthenticated: isDirectlyAuthenticated,
          userId: data.user?.id
        });
        setDirectAuthCheck(isDirectlyAuthenticated);
      } catch (error) {
        console.error("Error in direct auth check:", error);
        setDirectAuthCheck(false);
      }
    };
    
    checkAuthDirectly();
  }, []);
  
  // Use either context auth or direct auth check, whichever confirms the user is authenticated
  const isAuthenticated = !!(session || user || directAuthCheck);
  const isDisabled = isLoading || processingAIResponse || !isAuthenticated;
  
  let buttonText = isLoading ? 
    "Saving..." : 
    processingAIResponse ? 
      "Processing..." : 
      isEditing ? 
        "Update Task" : 
        "Create Task";
        
  if (!isAuthenticated) {
    buttonText = "Sign in to create tasks";
  }

  // If we're still loading auth state, show a loading state
  if (loading && directAuthCheck === null) {
    buttonText = "Checking authentication...";
  }

  return (
    <div className={`${isMobile ? 'sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-[#9b87f5]/20 z-50' : 'p-4'}`}>
      <Button
        id="task-form-submit-button"
        type="submit"
        className={`w-full ${!isAuthenticated ? 'bg-gray-400' : 'bg-gradient-to-r from-[#9b87f5] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#7C3AED]'} text-white shadow-sm transition-all duration-200`}
        disabled={isDisabled}
        onClick={() => {
          console.log("Submit button clicked");
          console.log("Button state:", { 
            isLoading, 
            processingAIResponse, 
            isEditing, 
            isDisabled,
            isAuthenticated,
            contextAuth: { hasSession: !!session, hasUser: !!user },
            directAuth: directAuthCheck,
            authLoading: loading
          });
        }}
      >
        {buttonText}
      </Button>
    </div>
  );
}
