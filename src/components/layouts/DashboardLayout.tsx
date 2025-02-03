import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileHeader } from "@/components/layouts/MobileHeader";

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
        <MobileHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 mt-[72px]">
          {children}
        </main>
      </div>
    </div>
  );
}