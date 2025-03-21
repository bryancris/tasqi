
import { cn } from "@/lib/utils";

interface DashboardViewWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardViewWrapper({ children, className }: DashboardViewWrapperProps) {
  return (
    <div className={cn("h-full w-full p-4 md:p-6", className)}>
      {children}
    </div>
  );
}
