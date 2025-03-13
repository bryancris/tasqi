
import { LogIn, LogOut, DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/components/ui/use-toast";

const NavButtons = () => {
  const { session, handleSignOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await handleSignOut();
      // Don't navigate here - AuthContext will handle the state change
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
      {/* Tasqi home button - always visible */}
      <Link to="/">
        <Button 
          variant="outline"
          className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white"
        >
          <Home className="mr-2 h-4 w-4" />
          Tasqi
        </Button>
      </Link>

      {/* Pricing button - always visible */}
      <Link to="/pricing">
        <Button 
          variant="outline"
          className="border-blue-600 bg-transparent text-blue-600 hover:bg-blue-600 hover:text-white"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Pricing
        </Button>
      </Link>

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
