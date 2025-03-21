
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardViewWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardViewWrapper({ children, className }: DashboardViewWrapperProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "h-full w-full", 
      // Apply different padding for mobile vs desktop
      isMobile ? "px-3 py-2" : "p-4 md:p-6", 
      className
    )}>
      {children}
    </div>
  );
}
