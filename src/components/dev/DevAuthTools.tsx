import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from '@/contexts/auth';
import { isDevelopmentMode } from '@/contexts/auth/provider/constants';

const isDev = isDevelopmentMode;

export function DevAuthTools() {
  const [expanded, setExpanded] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);
  const { loading, initialized } = useAuth();
  
  useEffect(() => {
    const checkBypassState = () => {
      try {
        const savedBypass = sessionStorage.getItem('dev_bypass_auth');
        setBypassAuth(savedBypass === 'true');
      } catch (e) {
        console.error("Error checking bypass state:", e);
      }
    };
    
    checkBypassState();
    
    const handleStorageChange = () => {
      checkBypassState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const toggleBypass = () => {
    try {
      const newValue = !bypassAuth;
      setBypassAuth(newValue);
      
      sessionStorage.setItem('dev_bypass_auth', newValue.toString());
      
      if (newValue) {
        sessionStorage.setItem('force_auth_initialized', 'true');
        toast.success("Development mode: Auth bypass enabled", {
          duration: 3000,
        });
      } else {
        sessionStorage.removeItem('force_auth_initialized');
        toast.info("Development mode: Auth bypass disabled", {
          duration: 3000,
        });
      }
      
      window.location.reload();
    } catch (e) {
      console.error("Error toggling bypass:", e);
      toast.error("Failed to toggle auth bypass");
    }
  };
  
  const forceAuthInit = () => {
    try {
      sessionStorage.setItem('force_auth_initialized', 'true');
      toast.success("Auth forced to initialized state, reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      console.error("Error forcing auth init:", e);
      toast.error("Failed to force auth initialization");
    }
  };
  
  const resetAuthState = () => {
    try {
      localStorage.removeItem('dev_auth_state');
      sessionStorage.removeItem('force_auth_initialized');
      sessionStorage.removeItem('dev_bypass_auth');
      sessionStorage.removeItem('auth_last_mount_time');
      
      toast.success("Auth state reset, reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      console.error("Error resetting auth state:", e);
      toast.error("Failed to reset auth state");
    }
  };
  
  return null;
}
