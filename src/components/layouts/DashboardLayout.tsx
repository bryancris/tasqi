import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          {children}
        </div>
      </div>
    </div>
  );
}