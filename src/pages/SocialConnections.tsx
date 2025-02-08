
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SocialConnectionsContent } from "@/components/self-care/SocialConnectionsContent";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const SocialConnections = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="pb-20 pt-16">
        <MobileHeader />
        <SocialConnectionsContent />
        <MobileFooter />
      </div>
    );
  }

  return (
    <DashboardLayout selectedDate={selectedDate} onDateChange={setSelectedDate}>
      <SocialConnectionsContent />
    </DashboardLayout>
  );
};

export default SocialConnections;
