
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { toast } from "sonner";

export function HeaderUserMenu() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Clear local session state first
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Even if there's an error, we want to redirect to auth
      // since the session is already cleared locally
      navigate('/auth');
      
      // Only show error if it's not related to session not found
      if (error && !error.message?.includes('session_not_found')) {
        console.error('Error logging out:', error);
        toast.error("There was an issue logging out");
      } else {
        toast.success("Successfully logged out");
      }
    } catch (error) {
      console.error('Error in logout process:', error);
      // Still redirect to auth page even if there's an error
      navigate('/auth');
      toast.error("There was an issue logging out");
    }
  };

  const handleInstall = () => {
    if (typeof window.showInstallPrompt === 'function') {
      window.showInstallPrompt();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>
                {session?.user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem className="flex-col items-start">
            <div className="font-medium">{session?.user.email}</div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Install App
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="py-6">
            <SettingsContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
