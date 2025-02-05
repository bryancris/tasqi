
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SelfCareContent } from "@/components/self-care/SelfCareContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const SelfCare = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

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
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <SelfCareContent />
    </DashboardLayout>
  );
};

export default SelfCare;

