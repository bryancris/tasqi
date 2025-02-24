
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import MobileHeader from "./MobileHeader";
import MobileFooter from "./MobileFooter";
import { Sidebar } from "../dashboard/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <MobileHeader />
          <main className="pb-16">
            <div className="container mx-auto px-4">
              <div key={location.pathname}>
                <Outlet />
              </div>
            </div>
          </main>
          <MobileFooter />
        </>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              <div key={location.pathname}>
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
