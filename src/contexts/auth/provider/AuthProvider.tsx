
import { AuthProviderComponent } from './AuthProviderComponent';

/**
 * Provider for authentication state
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simply wrap the component - this makes hot reloading more reliable
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
};
