
import { Activity, Brain, Heart, Leaf, Sun, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    title: "Physical Wellness",
    icon: Activity,
    description: "Exercise, nutrition, and rest for your body",
    gradient: "from-[#FF719A] to-[#FF9F9F]",
    iconColor: "text-[#FF719A]",
    path: "/self-care/physical-wellness",
  },
  {
    title: "Mental Wellbeing",
    icon: Brain,
    description: "Meditation, mindfulness, and mental exercises",
    gradient: "from-[#8B5CF6] to-[#D946EF]",
    iconColor: "text-[#8B5CF6]",
  },
  {
    title: "Personal Growth",
    icon: Leaf,
    description: "Learning, development, and self-improvement",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
  {
    title: "Social Connection",
    icon: User,
    description: "Building and maintaining relationships",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
  {
    title: "Daily Rituals",
    icon: Sun,
    description: "Routines and habits for wellbeing",
    gradient: "from-[#F97316] to-[#FDBA74]",
    iconColor: "text-[#F97316]",
  },
  {
    title: "Emotional Care",
    icon: Heart,
    description: "Understanding and processing emotions",
    gradient: "from-[#E11D48] to-[#FDA4AF]",
    iconColor: "text-[#E11D48]",
  },
];

export function SelfCareContent() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className={isMobile ? "px-4 py-2" : "container mx-auto p-6"}>
      <div className="max-w-3xl mx-auto">
        <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-2 bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent`}>
          Self Care
        </h1>
        <p className="text-muted-foreground mb-6">
          Nurture your wellbeing with these essential self-care activities
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.title}
                className="overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => category.path && navigate(category.path)}
              >
                <div className={`h-full bg-gradient-to-r ${category.gradient} p-0.5`}>
                  <div className="bg-white dark:bg-gray-950 p-4 h-full">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-lg`}>
                        <Icon className={`w-6 h-6 ${category.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
