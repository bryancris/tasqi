
import { Activity, Brain, Heart, Leaf, Sun, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "px-4 py-2" : "container mx-auto p-6"}>
      <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-2`}>Self Care</h1>
      <p className="text-muted-foreground mb-6">
        Nurture your wellbeing with these essential self-care activities
      </p>
      
      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.title}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
