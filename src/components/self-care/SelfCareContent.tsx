import { Activity, Brain, Heart, Leaf, Sun, User } from "lucide-react";
import { Card } from "@/components/ui/card";

const categories = [
  {
    title: "Physical Wellness",
    icon: Activity,
    description: "Exercise, nutrition, and rest for your body",
  },
  {
    title: "Mental Wellbeing",
    icon: Brain,
    description: "Meditation, mindfulness, and mental exercises",
  },
  {
    title: "Personal Growth",
    icon: Leaf,
    description: "Learning, development, and self-improvement",
  },
  {
    title: "Social Connection",
    icon: User,
    description: "Building and maintaining relationships",
  },
  {
    title: "Daily Rituals",
    icon: Sun,
    description: "Routines and habits for wellbeing",
  },
  {
    title: "Emotional Care",
    icon: Heart,
    description: "Understanding and processing emotions",
  },
];

export function SelfCareContent() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Self Care</h1>
      <p className="text-muted-foreground mb-8">
        Nurture your wellbeing with these essential self-care activities
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.title}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{category.title}</h3>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}