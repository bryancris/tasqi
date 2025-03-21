
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useState, useEffect } from "react";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { DesktopHeader } from "@/components/layouts/DesktopHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter"; // Import MobileFooter
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
          {isMobile ? (
            <MobileHeader />
          ) : (
            <DesktopHeader />
          )}
          <main className={cn(
            "flex-1 relative overflow-y-auto focus:outline-none",
            "bg-slate-50 dark:bg-gray-900",
            isMobile ? "pb-20" : "", // Add padding at bottom for mobile footer
            "pt-14 md:pt-16" // Add top padding to avoid header overlap
          )}>
            <div className="h-full w-full">
              {children}
            </div>
          </main>
          {isMobile && <MobileFooter />}
        </div>
      </div>
    </TooltipProvider>
  );
}
