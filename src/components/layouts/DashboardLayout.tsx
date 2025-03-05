
import React, { useEffect, useRef } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileFooter } from "./MobileFooter";
import { Sidebar } from "../dashboard/Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const {
    selectedDate,
    setSelectedDate
  } = useCalendarView();
  
  // Initialize Supabase subscriptions once - will handle its own initialization check
  useSupabaseSubscription();
  
  // Use ref to track if we've already logged the mount message
  const hasLoggedMount = useRef(false);
  
  useEffect(() => {
    if (!hasLoggedMount.current) {
      console.log("DashboardLayout mounted");
      hasLoggedMount.current = true;
    }
  }, []);

  return <div className="min-h-screen bg-white">
      {isMobile ? <>
          <MobileHeader />
          <main className="flex-1 pb-16 pt-[72px] scrollbar-hide">
            <ErrorBoundary fallback={<div className="p-4 text-center">Something went wrong loading the dashboard. Please refresh the page.</div>}>
              {children}
            </ErrorBoundary>
          </main>
          <MobileFooter />
        </> : <div className="flex h-screen overflow-hidden">
          <Sidebar selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Fixed height header */}
            <div className="h-[72px] flex-shrink-0 relative bg-background border-b">
              <DesktopHeader />
            </div>
            {/* Main content area with proper padding */}
            <main className="flex-1 overflow-y-auto bg-[#f8f9fa] p-6 px-[20px] py-0">
              <ErrorBoundary fallback={<div className="p-4 text-center">Something went wrong loading the dashboard. Please refresh the page.</div>}>
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </div>}
    </div>;
}
