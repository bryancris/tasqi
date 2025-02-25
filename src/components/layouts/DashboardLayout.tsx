
import React, { useEffect } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileFooter } from "./MobileFooter";
import { Sidebar } from "../dashboard/Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCalendarView } from "@/contexts/CalendarViewContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const { selectedDate, setSelectedDate } = useCalendarView();

  useEffect(() => {
    console.log("DashboardLayout mounted");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {isMobile ? (
        <>
          <MobileHeader />
          <main className="flex-1 pb-16 pt-[72px]">
            {children}
          </main>
          <MobileFooter />
        </>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <DesktopHeader />
            <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
