
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarView } from "@/contexts/CalendarViewContext";
import { Link, useLocation } from "react-router-dom";

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
  const location = useLocation();
  const isActive = currentView === view;

  return (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "w-full justify-start text-base pl-8",
        isActive 
          ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
          : 'text-[#6B7280] hover:bg-[#E5E7EB]'
      )}
    >
      <Link 
        to={`/dashboard${view === 'tasks' ? '' : `/${view}`}`}
        replace
      >
        {label}
      </Link>
    </Button>
  );
}
