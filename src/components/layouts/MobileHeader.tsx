
import { useNavigate } from "react-router-dom";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { TestTube, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { toast } from "sonner";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";

export function MobileHeader() {
  const navigate = useNavigate();

  const handleTestNotifications = async () => {
    try {
      console.log('Testing notifications setup...');
      await setupPushSubscription();
      toast.success('Push notifications test completed');
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('Failed to test notifications');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between gap-4">
          <HeaderTime />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/add-task')}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTestNotifications}
              className="h-8 w-8"
            >
              <TestTube className="h-4 w-4" />
            </Button>
            <HeaderNotifications />
            <HeaderUserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

