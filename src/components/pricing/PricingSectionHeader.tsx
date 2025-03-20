
import React from "react";

interface PricingSectionHeaderProps {
  title: string;
  description: string;
}

const PricingSectionHeader = ({ title, description }: PricingSectionHeaderProps) => {
  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
        {title}
      </h1>
      <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
        {description}
      </p>
    </div>
  );
};

export default PricingSectionHeader;
