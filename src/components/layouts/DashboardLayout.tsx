
import { Sidebar } from "@/components/dashboard/Sidebar";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPushSubscription } from "@/utils/notifications/subscriptionUtils";
import { toast } from "sonner";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onViewChange?: (view: 'tasks' | 'calendar' | 'yearly' | 'weekly') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DashboardLayout({ children, onViewChange, selectedDate, onDateChange }: DashboardLayoutProps) {
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
    <div className="h-screen flex">
      <Sidebar onViewChange={onViewChange} selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[72px] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container h-full">
            <div className="flex h-full items-center justify-between">
              <HeaderTime />
              <div className="flex items-center gap-2">
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
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
