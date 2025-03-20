
import { PricingTierProps } from "./PricingTier";

export const pricingTiers: PricingTierProps[] = [
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
    price: "$24.99",
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
    price: "$12.99",
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

// Helper to separate tiers into consumer and business groups
export const getConsumerTiers = () => pricingTiers.slice(0, 3);
export const getBusinessTiers = () => pricingTiers.slice(3);
