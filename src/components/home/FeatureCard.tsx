
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor: string;
}

const FeatureCard = ({ icon: Icon, title, description, iconColor }: FeatureCardProps) => {
  // Extract color name from the Tailwind class (e.g., "text-blue-600" -> "blue")
  const colorName = iconColor.match(/text-([a-z]+)-\d+/)?.[1] || 'blue';
  
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-105",
        "bg-white/90 hover:bg-white/95 backdrop-blur-sm",
        "border border-gray-200 hover:border-transparent",
        "shadow-sm hover:shadow-md",
        `hover:shadow-${colorName}-100/30`,
        "before:absolute before:inset-0 before:z-0 before:bg-gradient-to-br",
        `before:from-${colorName}-50/40 before:to-${colorName}-100/10`,
        "hover:before:opacity-100 before:opacity-50 before:transition-opacity"
      )}
    >
      <span 
        className={cn(
          "absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700",
          "bg-gradient-to-br border border-transparent rounded-lg",
          `from-${colorName}-200/20 via-transparent to-${colorName}-200/20`,
          "group-hover:opacity-100"
        )} 
        aria-hidden="true"
      />

      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div 
            className={cn(
              "rounded-full p-3 mb-4 transition-transform duration-300",
              `${iconColor} bg-${colorName}-50/50`,
              "group-hover:scale-110"
            )}
          >
            <Icon className={`w-10 h-10 transition-all duration-300`} />
          </div>
          
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
