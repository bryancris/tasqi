
import { supabase } from "@/integrations/supabase/client";
import { GLOBAL_AUTH_STATE } from "@/contexts/auth/hooks/auth-subscription/constants";

/**
 * Get the current user session directly without relying on context
 * This is useful for code that runs outside of the React component lifecycle
 */
export const getDirectSession = async () => {
  try {
    // First check if we have a cached session in global state
    if (GLOBAL_AUTH_STATE.sessionData) {
      return GLOBAL_AUTH_STATE.sessionData;
    }
    
    // If not, check with Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Direct session check error:", error);
      return null;
    }
    
    // Cache the session for future calls
    if (data?.session) {
      GLOBAL_AUTH_STATE.sessionData = data.session;
    }
    
    return data?.session || null;
  } catch (error) {
    console.error("Error in direct session check:", error);
    return null;
  }
};

/**
 * Get the current user ID directly without relying on context
 * This is useful for code that runs outside of the React component lifecycle
 */
export const getDirectUserId = async () => {
  const session = await getDirectSession();
  return session?.user?.id || null;
};

// Clear the cached session data
export const clearDirectSession = () => {
  GLOBAL_AUTH_STATE.sessionData = null;
};
