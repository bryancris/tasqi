
import { Session } from "@supabase/supabase-js";
import { useSignOutLogic } from "./sign-out";

type SignOutProps = {
  mounted: React.MutableRefObject<boolean>;
  setSession: (session: Session | null) => void;
  setUser: (user: Session["user"] | null) => void;
  setLoading: (loading: boolean) => void;
  hasToastRef: React.MutableRefObject<boolean>;
  authStateSubscription: React.MutableRefObject<{ unsubscribe: () => void } | null>;
};

/**
 * Backward-compatible hook for signing out
 */
export const useSignOut = (props: SignOutProps) => {
  // Use the refactored sign out logic
  const { handleSignOut } = useSignOutLogic(props);
  
  return { handleSignOut };
};
