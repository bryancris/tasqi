import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SelfCareContent } from "@/components/self-care/SelfCareContent";
import { useState } from "react";

const SelfCare = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <SelfCareContent />
    </DashboardLayout>
  );
};

export default SelfCare;