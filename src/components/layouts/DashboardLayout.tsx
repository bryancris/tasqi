import { Sidebar } from "@/components/dashboard/Sidebar";
import { useState, useEffect } from "react";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { DesktopHeader } from "@/components/layouts/DesktopHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";
import { useAuthSync } from "@/hooks/use-auth-sync";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCalendarView } from "@/contexts/CalendarViewContext";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { selectedDate, setSelectedDate } = useCalendarView();

  // Use the auth sync hook to keep tasks in sync with auth state
  useAuthSync();
  
  // Update sidebar visibility based on screen size
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Force update on first render to ensure correct mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isMobileView = width <= 768;
      if (isMobileView !== isMobile) {
        // Force a re-render if needed
        setSidebarOpen(!isMobileView);
      }
    };
    
    // Check immediately and after a small delay to ensure proper rendering
    checkMobile();
    const timer = setTimeout(checkMobile, 50);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Only show sidebar if not mobile or if explicitly opened on mobile */}
        {(!isMobile || sidebarOpen) && (
          <Sidebar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}
        
        <div className={cn(
          "flex flex-col flex-1 overflow-hidden",
          isMobile ? "w-full" : "w-0" // Take full width on mobile
        )}>
          {isMobile ? (
            <MobileHeader />
          ) : (
            <DesktopHeader />
          )}
          
          <main className={cn(
            "flex-1 relative overflow-y-auto focus:outline-none",
            "bg-slate-50 dark:bg-gray-900",
            isMobile ? "pb-20" : "", // Add padding for mobile footer
            "pt-14 md:pt-16" // Add top padding to avoid header overlap
          )}>
            <div className="h-full w-full">
              {children}
            </div>
          </main>
          
          {/* Always show the mobile footer on mobile */}
          {isMobile && <MobileFooter />}
        </div>
      </div>
    </TooltipProvider>
  );
}
