
import React from "react";
import { Button } from "@/components/ui/button";

const PricingContactSection = () => {
  return (
    <div className="text-center mt-16">
      <h2 className="text-2xl font-bold text-gray-900">
        Have questions about our pricing?
      </h2>
      <p className="mt-4 max-w-xl mx-auto text-lg text-gray-500">
        Contact us for more information about our plans and custom solutions.
      </p>
      <Button className="mt-8 bg-blue-600 hover:bg-blue-700">
        Contact Sales
      </Button>
    </div>
  );
};

export default PricingContactSection;
