
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/notifications/use-notifications";

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
  const { showNotification } = useNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const userDisplayName = session?.user.user_metadata?.full_name || 
                         session?.user.user_metadata?.name ||
                         session?.user.email?.split('@')[0] ||
                         'User';

  const handleLogout = async (e) => {
    // Prevent default behavior to avoid page reload
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsLoggingOut(true);
      await handleSignOut();
      
      navigate('/auth', { replace: true });
      
      toast.success("Successfully logged out");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error during logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigateToSettings = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Settings button clicked, navigating to settings');
    // Close the dropdown first
    setIsMenuOpen(false);
    
    // Navigate to the correct settings route
    navigate('/settings');
  };

  const handleTestNotification = (e) => {
    // Prevent default browser behavior to avoid page reload
    e.preventDefault();
    
    // Stop event propagation to prevent it from bubbling up
    e.stopPropagation();
    
    console.log('🔔 Triggering test task notification with buttons');
    
    // Close the dropdown menu first
    setIsMenuOpen(false);
    
    // Clear any existing test notifications before showing new one
    const existingNotifications = document.querySelectorAll('[data-test-notification="999999"]');
    existingNotifications.forEach(notification => {
      const closeButton = notification.querySelector('[aria-label="Close notification"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    });

    // Add delay to ensure dropdown is closed and old notifications are cleared
    setTimeout(() => {
      // Create task notification with explicit reference data using exact string format for ID
      showNotification({
        title: "Task Reminder",
        message: "This is a test notification with action buttons",
        type: "info" as const,
        referenceId: "999999", // Using string format consistently
        referenceType: "task", // Must be lowercase "task"
        persistent: false // Make test notifications non-persistent
      });
      
      console.log('✅ Test task notification triggered with ID: 999999');
    }, 150);
  };

  // This function handles the user icon button click to prevent default behavior
  const handleUserIconClick = (e: React.MouseEvent) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle the menu open state
    setIsMenuOpen(!isMenuOpen);
    
    // Log for debugging
    console.log('User icon clicked, toggling dropdown menu');
  };

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full"
          onClick={handleUserIconClick}
          type="button" // Explicitly set button type to prevent form submission
        >
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
        <DropdownMenuItem 
          onClick={handleNavigateToSettings}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleTestNotification}
          onSelect={(e) => {
            // Prevent default selection behavior
            e.preventDefault();
          }}
        >
          <Bell className="mr-2 h-4 w-4" />
          Test Notification
        </DropdownMenuItem>
        <InstallButton
          isStandalone={isStandalone}
          installable={installable}
          deferredPrompt={deferredPrompt}
          setDeferredPrompt={setDeferredPrompt}
        />
        <UpdateButton isStandalone={isStandalone} />
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
          onSelect={(e) => {
            // Prevent default behavior
            e.preventDefault();
          }}
        >
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
