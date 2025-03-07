
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
  
  // Check if dev mode auth bypass is enabled on mount
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
    
    // Check again if localStorage changes
    const handleStorageChange = () => {
      checkBypassState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Toggle dev mode auth bypass
  const toggleBypass = () => {
    try {
      const newValue = !bypassAuth;
      setBypassAuth(newValue);
      
      // Store in sessionStorage
      sessionStorage.setItem('dev_bypass_auth', newValue.toString());
      
      // Force initialization state if turning on bypass
      if (newValue) {
        sessionStorage.setItem('force_auth_initialized', 'true');
        toast.success("Development mode: Auth bypass enabled", {
          duration: 3000,
        });
      } else {
        // Remove forced initialization when disabling bypass
        sessionStorage.removeItem('force_auth_initialized');
        toast.info("Development mode: Auth bypass disabled", {
          duration: 3000,
        });
      }
      
      // Reload the page to apply the changes
      window.location.reload();
    } catch (e) {
      console.error("Error toggling bypass:", e);
      toast.error("Failed to toggle auth bypass");
    }
  };
  
  // Force auth to be initialized immediately (for development testing)
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
  
  // Reset all auth state
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
  
  // Only show in development mode
  if (!isDev()) {
    return null;
  }
  
  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          className="bg-black/80 text-white border-gray-700 hover:bg-black"
          onClick={() => setExpanded(true)}
        >
          <span className="mr-2">🛠️</span> Dev Tools
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 bg-black/80 border-gray-700 text-white w-[300px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Auth Dev Tools</h3>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
            onClick={() => setExpanded(false)}
          >
            ✕
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm">Bypass Auth</div>
              <div className="text-xs text-gray-400">Skip auth checks in development</div>
            </div>
            <Switch
              checked={bypassAuth}
              onCheckedChange={toggleBypass}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className={loading ? "bg-amber-800/30" : "bg-gray-800"}>
              {loading ? "Loading" : "Not Loading"}
            </Badge>
            <Badge variant="outline" className={initialized ? "bg-green-800/30" : "bg-gray-800"}>
              {initialized ? "Initialized" : "Not Initialized"}
            </Badge>
            <Badge variant="outline" className={bypassAuth ? "bg-blue-800/30" : "bg-gray-800"}>
              {bypassAuth ? "Auth Bypassed" : "Normal Auth"}
            </Badge>
          </div>
          
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={forceAuthInit}
            >
              Force Initialize
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={resetAuthState}
            >
              Reset Auth State
            </Button>
          </div>
          
          <div className="pt-2 border-t border-gray-700 mt-2">
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                toast.success("All storage cleared, reloading...");
                setTimeout(() => window.location.reload(), 1000);
              }}
            >
              Clear All Storage & Reload
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
