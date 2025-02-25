
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
  
  // Only show as active if we're on a dashboard route and this is the current view
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isActive = isDashboardRoute && currentView === view;

  const handleClick = () => {
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
