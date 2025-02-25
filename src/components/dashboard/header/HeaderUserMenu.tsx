
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Download, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function HeaderUserMenu() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // Get user metadata or email for display
  const userDisplayName = session?.user.user_metadata?.full_name || 
                         session?.user.user_metadata?.name ||
                         session?.user.email?.split('@')[0] ||
                         'User';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Check if app is running in standalone mode
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isStandalone) {
      toast.info('App is already installed');
      return;
    }

    if (!deferredPrompt) {
      toast.info('Installation not available at this moment. Try opening the app in a supported browser.');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast.success('Installing app...');
      }
      // Reset the deferredPrompt for next time
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing app:', error);
      toast.error('Failed to install app');
    }
  };

  const handleUpdate = async () => {
    try {
      // Check if service worker is registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Trigger update check
        await registration.update();
        
        if (registration.waiting) {
          // If there's a waiting worker, it means an update is available
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          toast.success('Updating app...');
          // Reload the page to activate the new version
          window.location.reload();
        } else {
          toast.info('No updates available');
        }
      }
    } catch (error) {
      console.error('Error updating app:', error);
      toast.error('Failed to check for updates');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all storage first
      localStorage.clear();
      sessionStorage.clear();
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes('session_not_found')) {
        console.error('Error logging out:', error);
      }
      
      // Navigate after signing out
      navigate('/', { replace: true });
      toast.success("Successfully logged out");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error during logout");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={session?.user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
            <AvatarFallback>
              {userDisplayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="px-2 py-2 hover:bg-background cursor-default">
          <div className="flex flex-col">
            <span className="font-medium text-sm">{userDisplayName}</span>
            <span className="text-xs text-muted-foreground">{session?.user.email}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="w-full flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleInstall}>
          <Download className="mr-2 h-4 w-4" />
          {isStandalone ? 'Already Installed' : 'Install App'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleUpdate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Check for Updates
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
