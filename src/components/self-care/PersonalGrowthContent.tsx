
import { useIsMobile } from "@/hooks/use-mobile";
import { Book, Brain, Pencil, Star, Target, Trophy } from "lucide-react";
import { Card } from "../ui/card";

const activities = [
  {
    title: "Reading Goals",
    icon: Book,
    description: "Track your reading progress and set new goals",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
  {
    title: "Learning Journal",
    icon: Pencil,
    description: "Document your learning journey and insights",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
  {
    title: "Skill Development",
    icon: Brain,
    description: "Monitor progress in new skills and abilities",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
  {
    title: "Goal Setting",
    icon: Target,
    description: "Set and track personal development goals",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
  {
    title: "Achievements",
    icon: Trophy,
    description: "Celebrate and record your accomplishments",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
  {
    title: "Self-Reflection",
    icon: Star,
    description: "Regular check-ins with yourself and your growth",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
];

export function PersonalGrowthContent() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "px-4 py-2" : "container mx-auto p-6"}>
      <div className="max-w-3xl mx-auto">
        <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-2 bg-gradient-to-r from-[#2ECC71] to-[#82E0AA] bg-clip-text text-transparent`}>
          Personal Growth
        </h1>
        <p className="text-muted-foreground mb-6">
          Track your journey of continuous learning and self-improvement
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <Card
                key={activity.title}
                className="overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className={`h-full bg-gradient-to-r ${activity.gradient} p-0.5`}>
                  <div className="bg-white dark:bg-gray-950 p-4 h-full">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-lg`}>
                        <Icon className={`w-6 h-6 ${activity.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h3>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
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
