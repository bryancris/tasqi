
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PersonalGrowthContent } from "@/components/self-care/PersonalGrowthContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const PersonalGrowth = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="pb-20 pt-16">
        <MobileHeader />
        <PersonalGrowthContent />
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <PersonalGrowthContent />
    </DashboardLayout>
  );
};

export default PersonalGrowth;
