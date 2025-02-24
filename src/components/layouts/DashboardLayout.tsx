
import React from "react";
import { Outlet } from "react-router-dom";
import { MobileHeader } from "./MobileHeader";
import { MobileFooter } from "./MobileFooter";
import { Sidebar } from "../dashboard/Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileHeader />
          <main className="pb-16">
            <div className="container mx-auto px-4">
              <Outlet />
            </div>
          </main>
          <MobileFooter />
        </>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <main className="flex-1 overflow-y-auto relative">
            <DesktopHeader />
            <div className="container mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
