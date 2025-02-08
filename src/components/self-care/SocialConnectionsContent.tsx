
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell, Calendar, Heart, Mail, MessageCircle, UserPlus, Users } from "lucide-react";
import { Card } from "../ui/card";

const activities = [
  {
    title: "My Connections",
    icon: Users,
    description: "View and manage your social connections",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
  {
    title: "Connection Requests",
    icon: UserPlus,
    description: "Manage pending connection requests",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
  {
    title: "Social Activities",
    icon: Calendar,
    description: "Plan and join social activities",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
  {
    title: "Messages",
    icon: MessageCircle,
    description: "Chat with your connections",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
  {
    title: "Notifications",
    icon: Bell,
    description: "Stay updated with your social circle",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
  {
    title: "Support Network",
    icon: Heart,
    description: "Build and maintain your support system",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
];

export function SocialConnectionsContent() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "px-4 py-2" : "container mx-auto p-6"}>
      <div className="max-w-3xl mx-auto">
        <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-2 bg-gradient-to-r from-[#0EA5E9] to-[#7DD3FC] bg-clip-text text-transparent`}>
          Social Connection
        </h1>
        <p className="text-muted-foreground mb-6">
          Build and nurture meaningful relationships
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
