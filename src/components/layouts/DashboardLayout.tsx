
import React, { useEffect, useRef } from "react";
import { MobileHeader } from "./MobileHeader";
import { MobileFooter } from "./MobileFooter";
import { Sidebar } from "../dashboard/Sidebar";
import { DesktopHeader } from "./DesktopHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCalendarView } from "@/contexts/CalendarViewContext";
import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Add iOS PWA detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
const isIOSPWA = isIOS && isStandalone;

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
      console.log("Is iOS PWA:", isIOSPWA);
      hasLoggedMount.current = true;
    }
    
    // Add iOS PWA-specific meta tags for better WebView behavior
    if (isIOSPWA) {
      console.log("Configuring iOS PWA-specific settings");
      
      // Add meta tags for iOS if they don't exist
      if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const appleMobileWebAppCapable = document.createElement('meta');
        appleMobileWebAppCapable.setAttribute('name', 'apple-mobile-web-app-capable');
        appleMobileWebAppCapable.setAttribute('content', 'yes');
        document.head.appendChild(appleMobileWebAppCapable);
      }
      
      if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
        const statusBarStyle = document.createElement('meta');
        statusBarStyle.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        statusBarStyle.setAttribute('content', 'black-translucent');
        document.head.appendChild(statusBarStyle);
      }
    }
  }, []);

  return <div className="min-h-screen bg-white">
      {isMobile ? <>
          <MobileHeader />
          <main className={`flex-1 pb-16 pt-[72px] ${isIOSPWA ? 'ios-momentum-scroll' : 'scrollbar-hide'}`}>
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
