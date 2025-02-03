import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AnalyticsContent } from "@/components/analytics/AnalyticsContent";
import { useState } from "react";

const Analytics = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <AnalyticsContent />
    </DashboardLayout>
  );
};

export default Analytics;