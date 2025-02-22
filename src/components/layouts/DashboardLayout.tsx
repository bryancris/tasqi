
import { Sidebar } from "@/components/dashboard/Sidebar";
import { HeaderUserMenu } from "@/components/dashboard/header/HeaderUserMenu";
import { HeaderNotifications } from "@/components/dashboard/header/HeaderNotifications";
import { Button } from "@/components/ui/button";
import { AddTaskDrawer } from "@/components/dashboard/AddTaskDrawer";
import { Plus } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onViewChange?: (view: 'tasks' | 'calendar' | 'yearly' | 'weekly') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DashboardLayout({ children, onViewChange, selectedDate, onDateChange }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex bg-gradient-to-br from-[#F8F7FF] to-[#F2FCE2]">
      <Sidebar onViewChange={onViewChange} selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[72px] border-b border-[#E5DEFF] bg-white/50 backdrop-blur-md supports-[backdrop-filter]:bg-white/30 transition-colors">
          <div className="container h-full">
            <div className="flex h-full items-center justify-end gap-2">
              <AddTaskDrawer>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-2 border-[#9b87f5] bg-white/80 hover:bg-[#E5DEFF] hover:border-[#7E69AB] transition-all duration-200"
                >
                  <Plus className="h-5 w-5 text-[#6D4AFF]" />
                </Button>
              </AddTaskDrawer>
              <HeaderNotifications />
              <HeaderUserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-[#F8F7FF]/50 to-[#F2FCE2]/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
