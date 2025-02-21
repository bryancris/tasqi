
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
    <div className="h-screen flex">
      <Sidebar onViewChange={onViewChange} selectedDate={selectedDate} onDateChange={onDateChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[72px] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container h-full">
            <div className="flex h-full items-center justify-end gap-2">
              <AddTaskDrawer>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 hover:border-purple-500"
                >
                  <Plus className="h-5 w-5 text-purple-600" />
                </Button>
              </AddTaskDrawer>
              <HeaderNotifications />
              <HeaderUserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
