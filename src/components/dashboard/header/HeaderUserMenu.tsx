
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

import { UserAvatar } from "./user-menu/UserAvatar";
import { UserInfo } from "./user-menu/UserInfo";
import { InstallButton } from "./user-menu/InstallButton";
import { UpdateButton } from "./user-menu/UpdateButton";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function HeaderUserMenu() {
  const { session, handleSignOut } = useAuth();
  const navigate = useNavigate();
  const { deferredPrompt, isStandalone, installable, setDeferredPrompt } = useInstallPrompt();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const userDisplayName = session?.user.user_metadata?.full_name || 
                         session?.user.user_metadata?.name ||
                         session?.user.email?.split('@')[0] ||
                         'User';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await handleSignOut();
      
      // Navigate after successful logout
      navigate('/auth', { replace: true });
      
      // Only show toast if logged out successfully
      toast.success("Successfully logged out");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error during logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <UserAvatar
            avatarUrl={session?.user?.user_metadata?.avatar_url}
            fallbackText={userDisplayName}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="px-2 py-2 hover:bg-background cursor-default">
          <UserInfo
            displayName={userDisplayName}
            email={session?.user.email}
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard/settings" className="w-full flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <InstallButton
          isStandalone={isStandalone}
          installable={installable}
          deferredPrompt={deferredPrompt}
          setDeferredPrompt={setDeferredPrompt}
        />
        <UpdateButton isStandalone={isStandalone} />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
