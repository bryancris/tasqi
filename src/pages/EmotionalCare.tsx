
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { EmotionalCareContent } from "@/components/self-care/EmotionalCareContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const EmotionalCare = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="pb-20 pt-16">
        <MobileHeader />
        <EmotionalCareContent />
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <EmotionalCareContent />
    </DashboardLayout>
  );
};

export default EmotionalCare;
