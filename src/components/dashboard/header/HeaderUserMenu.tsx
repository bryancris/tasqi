
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function HeaderUserMenu() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  // Get user metadata or email for display
  const userDisplayName = session?.user.user_metadata?.full_name || 
                         session?.user.user_metadata?.name ||
                         session?.user.email?.split('@')[0] ||
                         'User';

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
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{session?.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="w-full flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
