
import React, { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { AuthProvider } from "./AuthProvider";

// Type definition for our context
export type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  handleSignOut: () => Promise<void>;
};

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  initialized: false,
  handleSignOut: async () => {},
});

// Hook for components to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Re-export the provider for convenience
export { AuthProvider };
