import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
}

const FeatureCard = ({ icon: Icon, title, description, iconColor }: FeatureCardProps) => {
  return (
    <Card className="bg-white border-gray-200 hover:border-blue-500 transition-colors shadow-sm">
      <CardContent className="p-6">
        <Icon className={`w-10 h-10 ${iconColor} mb-4`} />
        <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;