
import { LucideIcon } from "lucide-react";
import FeatureCard from "./FeatureCard";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
}

interface FeatureSectionProps {
  title: string;
  features: Feature[];
}

const FeatureSection = ({ title, features }: FeatureSectionProps) => {
  return (
    <div className="py-12 md:py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="group">
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              iconColor={feature.iconColor}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureSection;
