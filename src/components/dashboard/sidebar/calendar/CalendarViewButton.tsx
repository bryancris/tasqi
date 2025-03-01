
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarView, useCalendarView } from "@/contexts/CalendarViewContext";
import { useLocation } from "react-router-dom";

interface CalendarViewButtonProps {
  view: CalendarView;
  currentView: CalendarView;
  label: string;
}

export function CalendarViewButton({ 
  view, 
  currentView, 
  label
}: CalendarViewButtonProps) {
  const { setView } = useCalendarView();
  const location = useLocation();
  
  // Map views to paths for checking active state
  const viewPathMap = {
    tasks: '/dashboard/tasks',
    weekly: '/dashboard/week',
    monthly: '/dashboard/monthly',
    yearly: '/dashboard/yearly'
  };
  
  // Check if this button's view matches the current route
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isActive = isDashboardRoute && (
    currentView === view || 
    location.pathname === viewPathMap[view] || 
    (location.pathname === '/dashboard' && view === 'tasks')
  );

  const handleClick = () => {
    console.log("CalendarViewButton: Setting view to", view);
    setView(view);
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn(
        "w-full justify-start text-base pl-8",
        isActive 
          ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
          : 'text-[#6B7280] hover:bg-[#E5E7EB]'
      )}
    >
      {label}
    </Button>
  );
}
