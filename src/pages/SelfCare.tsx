
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SelfCareContent } from "@/components/self-care/SelfCareContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";
import { useCalendarView } from "@/contexts/CalendarViewContext";

// @fix-navigation: Implement consistent navigation across mobile and desktop views
const SelfCare = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();
  const { changeView } = useCalendarView();

  if (isMobile) {
    return (
      <div className="pb-20 pt-16">
        <MobileHeader />
        <SelfCareContent />
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
      <SelfCareContent />
    </DashboardLayout>
  );
};

export default SelfCare;
