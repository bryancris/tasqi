
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PhysicalWellnessContent } from "@/components/self-care/PhysicalWellnessContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const PhysicalWellness = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="pb-20 pt-16">
        <MobileHeader />
        <PhysicalWellnessContent />
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <PhysicalWellnessContent />
    </DashboardLayout>
  );
};

export default PhysicalWellness;
