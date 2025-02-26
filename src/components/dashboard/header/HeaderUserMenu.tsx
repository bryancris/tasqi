
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
  const [isChecking, setIsChecking] = useState(false);
  const [installable, setInstallable] = useState(false);
  
  // Get user metadata or email for display
  const userDisplayName = session?.user.user_metadata?.full_name || 
                         session?.user.user_metadata?.name ||
                         session?.user.email?.split('@')[0] ||
                         'User';

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      console.log('👋 Before install prompt event captured');
      setDeferredPrompt(e);
      setInstallable(true);
    };

    // Check if app is already installed
    const checkInstallState = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true || // iOS detection
                          window.location.search.includes('standalone=true');
      
      setIsStandalone(isStandalone);
      console.log('📱 App standalone status:', isStandalone);

      // Check if running on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS && !isStandalone) {
        console.log('🍎 Running on iOS - installation requires manual steps');
      }
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      console.log('🎉 PWA installed successfully');
      setInstallable(false);
      setIsStandalone(true);
      toast.success('App installed successfully!');
    });

    // Initial checks
    checkInstallState();

    // Check update status
    const checkUpdateComplete = () => {
      const updateStatus = localStorage.getItem('app_update_status');
      if (updateStatus === 'updating') {
        toast.success('Update successfully installed!');
        localStorage.removeItem('app_update_status');
      }
    };
    
    checkUpdateComplete();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (isStandalone) {
      toast.info('App is already installed');
      return;
    }

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      toast.info(
        'To install on iOS: tap the share button and select "Add to Home Screen"',
        { duration: 5000 }
      );
      return;
    }

    // Handle installation for other platforms
    if (!deferredPrompt) {
      console.log('❌ No installation prompt available');
      toast.info(
        'Installation not available. Try opening the app in a supported browser like Chrome.',
        { duration: 5000 }
      );
      return;
    }

    try {
      console.log('🚀 Triggering install prompt...');
      toast.loading('Opening install prompt...');

      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      console.log('👆 User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        toast.success('Installing app...');
      } else {
        toast.info('Installation cancelled');
      }
      
      // Clear the deferredPrompt for next time
      setDeferredPrompt(null);
      setInstallable(false);
    } catch (error) {
      console.error('❌ Error installing app:', error);
      toast.error('Failed to install app');
    }
  };

  const handleUpdate = async () => {
    if (isChecking) {
      toast.info('Already checking for updates...');
      return;
    }

    try {
      setIsChecking(true);
      toast.loading('Checking for updates...');

      // Check if service worker is registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Trigger update check
        await registration.update();
        
        if (registration.waiting) {
          // If there's a waiting worker, it means an update is available
          toast.success('Update found! Installing...', {
            duration: 3000,
          });

          // Store update status
          localStorage.setItem('app_update_status', 'updating');

          // Wait a moment to show the status
          setTimeout(() => {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            toast.success('Update complete! Restarting app...', {
              duration: 2000,
            });
            
            // Give users time to see the message before reload
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }, 1000);
        } else {
          toast.success('Your app is up to date!');
        }
      }
    } catch (error) {
      console.error('Error updating app:', error);
      toast.error('Failed to check for updates');
    } finally {
      setIsChecking(false);
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
        throw error;
      }
      
      // Navigate after signing out
      navigate('/', { replace: true });
      toast.success("Successfully logged out");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error during logout");
      navigate('/');
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
          <Link to="/dashboard/settings" className="w-full flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleInstall}
          disabled={isStandalone || (!installable && !(/iPad|iPhone|iPod/.test(navigator.userAgent)))}
        >
          <Download className="mr-2 h-4 w-4" />
          {isStandalone ? 'Already Installed' : 'Install App'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleUpdate} disabled={isChecking}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking for Updates...' : 'Check for Updates'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
