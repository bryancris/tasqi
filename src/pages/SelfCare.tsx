
import { SelfCareContent } from "@/components/self-care/SelfCareContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/layouts/MobileHeader";
import { MobileFooter } from "@/components/layouts/MobileFooter";

const SelfCare = () => {
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

  return <SelfCareContent />;
};

export default SelfCare;
