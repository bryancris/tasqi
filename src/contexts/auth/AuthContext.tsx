
import React, { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";

// Type definition for our context
export type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: Error | null;
  handleSignOut: () => Promise<void>;
};

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  initialized: false,
  error: null,
  handleSignOut: async () => {},
});

// Hook for components to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Re-export the provider
export { AuthProvider } from "./provider";
