
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarView } from "@/contexts/CalendarViewContext";
import { Link } from "react-router-dom";

interface CalendarViewButtonProps {
  view: CalendarView;
  currentView: CalendarView;
  label: string;
  onClick: (view: CalendarView) => void;
}

export function CalendarViewButton({ 
  view, 
  currentView, 
  label, 
  onClick 
}: CalendarViewButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(view);
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-base pl-8",
        currentView === view 
          ? 'bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0]' 
          : 'text-[#6B7280] hover:bg-[#E5E7EB]'
      )}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
