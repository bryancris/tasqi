
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

/**
 * Hook for components to use the auth context with better error handling
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
};
