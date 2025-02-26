import React, { useEffect } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileFooter } from "./MobileFooter";
import { Sidebar } from "../dashboard/Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription";
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

  // Initialize Supabase subscriptions
  useSupabaseSubscription();
  useEffect(() => {
    console.log("DashboardLayout mounted");
  }, []);
  return <div className="min-h-screen bg-white">
      {isMobile ? <>
          <MobileHeader />
          <main className="flex-1 pb-16 pt-[72px] scrollbar-hide">
            {children}
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
              {children}
            </main>
          </div>
        </div>}
    </div>;
}