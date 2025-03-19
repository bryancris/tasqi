import { Sidebar } from "@/components/dashboard/Sidebar";
import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { useAuthSync } from "@/hooks/use-auth-sync";
import { TooltipProvider } from "@/components/ui/tooltip";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Use the auth sync hook to keep tasks in sync with auth state
  useAuthSync();
  
  // Close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          selectedDate={new Date()}
          onDateChange={(date) => console.log('Date changed:', date)}
        />
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
            isSidebarOpen={sidebarOpen} 
          />
          <main className={cn(
            "flex-1 relative overflow-y-auto focus:outline-none",
            "bg-slate-50 dark:bg-gray-900",
            "p-4 md:p-6 transition-all duration-200 ease-in-out"
          )}>
            <div className="container mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
