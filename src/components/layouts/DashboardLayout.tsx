import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HeaderTime } from "@/components/dashboard/header/HeaderTime";
import { HeaderSearch } from "@/components/dashboard/header/HeaderSearch";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <p className="text-sm font-medium text-[#6366F1]">TasqiAI</p>
              <HeaderTime />
              <HeaderSearch />
            </div>
            <div className="flex items-center gap-4">
              <HeaderNotifications />
              <HeaderUserMenu />
            </div>
          </div>
        </header>
        <main className="container py-6">
          {children}
        </main>
        <ChatBubble />

        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="py-6">
              <p className="text-sm text-muted-foreground">Settings panel coming soon...</p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}