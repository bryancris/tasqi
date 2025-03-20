
import React, { useEffect } from "react";
import NavButtons from "@/components/home/NavButtons";
import GradientWaveBackground from "@/components/home/GradientWaveBackground";
import PricingTier from "@/components/pricing/PricingTier";
import PricingSectionHeader from "@/components/pricing/PricingSectionHeader";
import PricingContactSection from "@/components/pricing/PricingContactSection";
import { getConsumerTiers, getBusinessTiers } from "@/components/pricing/pricingData";

const Pricing = () => {
  useEffect(() => {
    document.body.classList.add('scrollable-page');
    return () => {
      document.body.classList.remove('scrollable-page');
    };
  }, []);

  // Get the pricing tiers from our data file
  const consumerTiers = getConsumerTiers();
  const businessTiers = getBusinessTiers();

  return (
    <>
      <GradientWaveBackground />
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <NavButtons />
        
        <PricingSectionHeader 
          title="Simple, transparent pricing"
          description="Choose the plan that works best for you and your workflow"
        />

        {/* First row: Consumer tiers */}
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {consumerTiers.map((tier) => (
            <PricingTier key={tier.name} {...tier} />
          ))}
        </div>

        {/* Second row: Business tiers */}
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {businessTiers.map((tier) => (
            <PricingTier key={tier.name} {...tier} />
          ))}
        </div>

        <PricingContactSection />
      </div>
    </>
  );
};

export default Pricing;
