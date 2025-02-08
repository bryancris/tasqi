
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DailyRitualsContent } from "@/components/self-care/DailyRitualsContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const DailyRituals = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="pb-20 pt-16">
        <MobileHeader />
        <DailyRitualsContent />
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <DailyRitualsContent />
    </DashboardLayout>
  );
};

export default DailyRituals;
