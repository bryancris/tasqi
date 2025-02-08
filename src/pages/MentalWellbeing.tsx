
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MentalWellbeingContent } from "@/components/self-care/MentalWellbeingContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const MentalWellbeing = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="pb-20 pt-16">
        <MobileHeader />
        <MentalWellbeingContent />
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <MentalWellbeingContent />
    </DashboardLayout>
  );
};

export default MentalWellbeing;
