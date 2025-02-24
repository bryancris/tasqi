
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarView, useCalendarView } from "@/contexts/CalendarViewContext";

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
  const isActive = currentView === view;

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
