
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
        "bg-gradient-to-br",
        `from-${colorName}-50 to-white`,
        "border border-gray-200",
        "shadow-md",
        `hover:shadow-${colorName}-200/50 hover:shadow-lg`,
        "backdrop-blur-sm"
      )}
    >
      {/* Glow effect */}
      <div 
        className={cn(
          "absolute -inset-0.5 bg-gradient-to-r",
          `from-${colorName}-300/30 to-${colorName}-100/20`,
          "rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        )} 
        aria-hidden="true"
      />
      
      {/* Inner shine effect */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          `from-${colorName}-100/30 via-white/80 to-${colorName}-50/20`,
          "opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        )}
        aria-hidden="true"
      />

      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div 
            className={cn(
              "rounded-full p-3 mb-4 transition-all duration-300 group-hover:scale-110",
              `${iconColor} bg-${colorName}-50`,
              "shadow-sm",
              `group-hover:shadow-${colorName}-200/50 group-hover:shadow-md`
            )}
          >
            <Icon className="w-10 h-10 transition-all duration-300" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
