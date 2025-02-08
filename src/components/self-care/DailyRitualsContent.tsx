
import { useIsMobile } from "@/hooks/use-mobile";
import { AlarmClock, Check, ListCheck, Moon, Sun } from "lucide-react";
import { Card } from "../ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../ui/use-toast";

interface DailyRitual {
  id: number;
  title: string;
  description: string | null;
  time_of_day: string | null;
  is_completed: boolean;
  frequency: string[];
}

const ritualTemplates = [
  {
    title: "Morning Meditation",
    icon: Sun,
    description: "Start your day with mindfulness",
    gradient: "from-[#F97316] to-[#FDBA74]",
    iconColor: "text-[#F97316]",
  },
  {
    title: "Evening Reflection",
    icon: Moon,
    description: "Review and appreciate your day",
    gradient: "from-[#8B5CF6] to-[#D946EF]",
    iconColor: "text-[#8B5CF6]",
  },
  {
    title: "Daily Movement",
    icon: ListCheck,
    description: "Keep your body active and energized",
    gradient: "from-[#2ECC71] to-[#82E0AA]",
    iconColor: "text-[#2ECC71]",
  },
  {
    title: "Gratitude Practice",
    icon: Check,
    description: "Express thankfulness for life's gifts",
    gradient: "from-[#E11D48] to-[#FDA4AF]",
    iconColor: "text-[#E11D48]",
  },
  {
    title: "Screen-Free Time",
    icon: AlarmClock,
    description: "Disconnect to reconnect with yourself",
    gradient: "from-[#0EA5E9] to-[#7DD3FC]",
    iconColor: "text-[#0EA5E9]",
  },
];

export function DailyRitualsContent() {
  const isMobile = useIsMobile();
  const [rituals, setRituals] = useState<DailyRitual[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRituals();
  }, []);

  const fetchRituals = async () => {
    const { data, error } = await supabase
      .from('daily_rituals')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch rituals",
        variant: "destructive",
      });
      return;
    }

    setRituals(data || []);
  };

  return (
    <div className={isMobile ? "px-4 py-2" : "container mx-auto p-6"}>
      <div className="max-w-3xl mx-auto">
        <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-2 bg-gradient-to-r from-[#F97316] to-[#FDBA74] bg-clip-text text-transparent`}>
          Daily Rituals
        </h1>
        <p className="text-muted-foreground mb-6">
          Build meaningful habits and routines for daily wellbeing
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {ritualTemplates.map((ritual) => {
            const Icon = ritual.icon;
            return (
              <Card
                key={ritual.title}
                className="overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className={`h-full bg-gradient-to-r ${ritual.gradient} p-0.5`}>
                  <div className="bg-white dark:bg-gray-950 p-4 h-full">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-lg`}>
                        <Icon className={`w-6 h-6 ${ritual.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{ritual.title}</h3>
                        <p className="text-sm text-muted-foreground">{ritual.description}</p>
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
