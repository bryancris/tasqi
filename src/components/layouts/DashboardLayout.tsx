
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { MobileHeader } from "./MobileHeader";
import { MobileFooter } from "./MobileFooter";
import { Sidebar } from "../dashboard/Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCalendarView } from "@/contexts/CalendarViewContext";

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const { selectedDate, setSelectedDate } = useCalendarView();

  useEffect(() => {
    console.log("DashboardLayout mounted");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        <>
          <MobileHeader />
          <main className="flex-1 pb-16 pt-[72px]">
            <Outlet />
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
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <Outlet />
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
