
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

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
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className={`p-3 rounded-lg inline-block mb-4 ${feature.iconColor} bg-opacity-10`}>
              <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureSection;
