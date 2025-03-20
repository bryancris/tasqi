
import React, { useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import NavButtons from "@/components/home/NavButtons";
import GradientWaveBackground from "@/components/home/GradientWaveBackground";
import { ScrollArea } from "@/components/ui/scroll-area";

const PricingTier = ({
  name,
  price,
  description,
  features,
  buttonText,
  popular = false,
}: {
  name: string;
  price: string;
  description: string;
  features: { name: string; included: boolean }[];
  buttonText: string;
  popular?: boolean;
}) => {
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

const Pricing = () => {
  useEffect(() => {
    document.body.classList.add('scrollable-page');
    return () => {
      document.body.classList.remove('scrollable-page');
    };
  }, []);

  const tiers = [
    {
      name: "Free",
      price: "Free",
      description: "Basic features for personal productivity",
      features: [
        { name: "Up to 10 tasks per day", included: true },
        { name: "Basic task management", included: true },
        { name: "Daily planner view", included: true },
        { name: "Task reminders", included: true },
        { name: "AI assistance (limited)", included: true },
        { name: "Task sharing", included: false },
        { name: "Calendar integrations", included: false },
        { name: "Priority support", included: false },
      ],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Personal",
      price: "$9.99",
      description: "Enhanced features for individual productivity",
      features: [
        { name: "Unlimited tasks", included: true },
        { name: "Advanced task management", included: true },
        { name: "Calendar integrations", included: true },
        { name: "Personal analytics", included: true },
        { name: "Full AI assistance", included: true },
        { name: "Task reminders", included: true },
        { name: "Priority support", included: true },
        { name: "White-label branding", included: false },
      ],
      buttonText: "Go Personal",
      popular: false,
    },
    {
      name: "Family",
      price: "$19.99",
      description: "Perfect for families and small groups",
      features: [
        { name: "Unlimited tasks", included: true },
        { name: "Share with up to 5 family members", included: true },
        { name: "Family calendar integration", included: true },
        { name: "Shared task lists", included: true },
        { name: "Family milestones tracking", included: true },
        { name: "AI task suggestions", included: true },
        { name: "Priority support", included: false },
        { name: "White-label branding", included: false },
      ],
      buttonText: "Start Family Plan",
      popular: true,
    },
    {
      name: "Pro",
      price: "$19.99",
      description: "Advanced features for power users",
      features: [
        { name: "Everything in Family plan", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Unlimited task history", included: true },
        { name: "Advanced AI assistance", included: true },
        { name: "Custom task templates", included: true },
        { name: "API access", included: true },
        { name: "Priority support", included: true },
        { name: "White-label branding", included: false },
      ],
      buttonText: "Go Pro",
      popular: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solutions for organizations",
      features: [
        { name: "Everything in Pro plan", included: true },
        { name: "Unlimited team members", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Custom integrations", included: true },
        { name: "Advanced security features", included: true },
        { name: "Single sign-on (SSO)", included: true },
        { name: "Admin dashboard", included: true },
        { name: "White-label branding", included: true },
      ],
      buttonText: "Contact Sales",
      popular: false,
    },
  ];

  // Separate tiers into two groups: consumer (first 3) and business (last 2)
  const consumerTiers = tiers.slice(0, 3);
  const businessTiers = tiers.slice(3);

  return (
    <>
      <GradientWaveBackground />
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <NavButtons />
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Choose the plan that works best for you and your workflow
          </p>
        </div>

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
      </div>
    </>
  );
};

export default Pricing;
