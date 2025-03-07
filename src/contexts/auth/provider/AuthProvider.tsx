
import React from "react";
import { AuthProviderComponent } from "./AuthProviderComponent";

/**
 * Provider for authentication state
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
};
