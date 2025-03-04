
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const NavButtons = () => {
  const navigate = useNavigate();
  const { session, handleSignOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await handleSignOut();
      // Don't use navigate here as it might trigger a reload
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
          <Link to="/dashboard">
            <Button 
              variant="outline"
              className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              Dashboard
            </Button>
          </Link>
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
        <Link to="/auth">
          <Button 
            variant="outline"
            className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </Link>
      )}
    </div>
  );
};

export default NavButtons;
