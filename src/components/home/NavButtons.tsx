import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const NavButtons = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      {session ? (
        <>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="bg-white/10 text-white border-white hover:bg-white hover:text-[#1a1b3b]"
          >
            Dashboard
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="bg-white/10 text-white border-white hover:bg-white hover:text-[#1a1b3b]"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </>
      ) : (
        <Button 
          onClick={() => navigate('/auth')} 
          variant="outline" 
          className="bg-white/10 text-white border-white hover:bg-white hover:text-[#1a1b3b]"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      )}
    </div>
  );
};

export default NavButtons;