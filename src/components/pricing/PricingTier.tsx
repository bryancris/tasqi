
import React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export interface PricingFeature {
  name: string;
  included: boolean;
}

export interface PricingTierProps {
  name: string;
  price: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  popular?: boolean;
}

const PricingTier = ({
  name,
  price,
  description,
  features,
  buttonText,
  popular = false,
}: PricingTierProps) => {
  return (
    <Card className={`w-full flex flex-col ${popular ? "border-blue-600 shadow-lg" : ""}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {name}
          {popular && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">POPULAR</span>}
        </CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          {price !== "Free" && <span className="text-gray-500 ml-1">/month</span>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 mt-1">
                {feature.included ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-300" />
                )}
              </span>
              <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className={`w-full ${
            popular 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingTier;
