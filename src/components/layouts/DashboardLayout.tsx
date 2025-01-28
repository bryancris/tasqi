import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ChatBubble } from "@/components/chat/ChatBubble";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const currentTime = format(new Date(), 'HH:mm');
  const currentDate = format(new Date(), 'EEE, MMM d');

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <p className="text-sm font-medium text-[#6366F1]">TasqiAI</p>
              <div>
                <p className="text-sm text-gray-500">{currentTime} {currentDate}</p>
              </div>
              <div className="relative w-96">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-600" />
              </Button>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className="container py-6">
          {children}
        </main>
        <ChatBubble />
      </div>
    </div>
  );
}