
import { CalendarDays } from "lucide-react";
import { CalendarViewButton } from "./calendar/CalendarViewButton";
import { useCalendarView, CalendarView } from "@/contexts/CalendarViewContext";
import { useLocation } from "react-router-dom";

interface CalendarSectionProps {
  onViewChange?: (view: CalendarView) => void;
}

export function CalendarSection({ onViewChange }: CalendarSectionProps) {
  const { view, changeView } = useCalendarView();
  const location = useLocation();

  const handleViewChange = (newView: CalendarView) => {
    changeView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 px-2 py-1">
        <CalendarDays className="h-5 w-5 text-[#6366F1]" />
        <span className="text-base font-medium text-gray-700">Calendar View</span>
      </div>

      <div className="space-y-1">
        <CalendarViewButton
          view="tasks"
          currentView={view}
          label="Daily"
          onClick={handleViewChange}
        />
        <CalendarViewButton
          view="weekly"
          currentView={view}
          label="Weekly"
          onClick={handleViewChange}
        />
        <CalendarViewButton
          view="calendar"
          currentView={view}
          label="Monthly"
          onClick={handleViewChange}
        />
        <CalendarViewButton
          view="yearly"
          currentView={view}
          label="Yearly"
          onClick={handleViewChange}
        />
      </div>
    </div>
  );
}
