
import { CalendarDays } from "lucide-react";
import { CalendarViewButton } from "./calendar/CalendarViewButton";
import { useCalendarView } from "@/contexts/CalendarViewContext";

export function CalendarSection() {
  const { view } = useCalendarView();

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
        />
        <CalendarViewButton
          view="weekly"
          currentView={view}
          label="Weekly"
        />
        <CalendarViewButton
          view="calendar"
          currentView={view}
          label="Monthly"
        />
        <CalendarViewButton
          view="yearly"
          currentView={view}
          label="Yearly"
        />
      </div>
    </div>
  );
}
