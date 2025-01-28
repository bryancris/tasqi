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

interface HeaderUserMenuProps {
  setIsSettingsOpen: (open: boolean) => void;
}

export function HeaderUserMenu({ setIsSettingsOpen }: HeaderUserMenuProps) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleInstall = () => {
    if (typeof window.showInstallPrompt === 'function') {
      window.showInstallPrompt();
    }
  };

  return (
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
  );
}