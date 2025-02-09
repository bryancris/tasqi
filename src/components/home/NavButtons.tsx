
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
      // Clear all storage first
      localStorage.clear();
      sessionStorage.clear();
      
      // Navigate before signing out
      navigate('/');
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes('session_not_found')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    console.log('Attempting navigation to auth page...');
    navigate('/auth');
    console.log('Navigation command executed');
  };

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      {session ? (
        <>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline"
            className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            Dashboard
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </>
      ) : (
        <Button 
          onClick={handleLogin}
          variant="outline"
          className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      )}
    </div>
  );
};

export default NavButtons;
