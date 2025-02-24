
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AnalyticsContent } from "@/components/analytics/AnalyticsContent";
import { useState } from "react";
import { useCalendarView } from "@/contexts/CalendarViewContext";

// @fix-navigation: Use state-based navigation and persist view state
const Analytics = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { changeView } = useCalendarView();

  return (
    <DashboardLayout 
      selectedDate={selectedDate} 
      onDateChange={setSelectedDate}
      onViewChange={changeView}
    >
      <AnalyticsContent />
    </DashboardLayout>
  );
};

export default Analytics;
