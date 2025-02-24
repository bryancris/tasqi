
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { NotesContent } from "@/components/notes/NotesContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { useState } from "react";
import { useCalendarView } from "@/contexts/CalendarViewContext";

// @fix-navigation: Implement state-based navigation to prevent page reloads
const Notes = () => {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { changeView } = useCalendarView();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader />
        <div className="pt-16 pb-20">
          <NotesContent />
        </div>
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout 
      selectedDate={selectedDate} 
      onDateChange={setSelectedDate}
      onViewChange={changeView}
    >
      <NotesContent />
    </DashboardLayout>
  );
};

export default Notes;
