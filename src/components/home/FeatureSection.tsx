import React from 'react';
import FeatureCard from './FeatureCard';
import { IconProps } from 'lucide-react';

interface FeatureSectionProps {
  title: string;
  features: {
    icon: React.ComponentType<IconProps>;
    title: string;
    description: string;
    iconColor: string;
  }[];
}

const FeatureSection = ({ title, features }: FeatureSectionProps) => {
  return (
    <div className="max-w-6xl mx-auto mb-20">
      <h2 className="text-3xl font-bold text-center mb-10">{title}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            iconColor={feature.iconColor}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureSection;