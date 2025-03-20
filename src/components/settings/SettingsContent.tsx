import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppearanceSettings } from "./appearance/AppearanceSettings";
import { CalendarSettings } from "./calendar/CalendarSettings";
import { TaskSharingSettings } from "./task-sharing/TaskSharingSettings";
import { ProfileSettings } from "./profile/ProfileSettings";
import { AdminSettings } from "./admin/AdminSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRound, Shield } from "lucide-react";

export function SettingsContent() {
  const [startHour, setStartHour] = useState<string>("8");
  const [endHour, setEndHour] = useState<string>("17");

  const loadUserSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('start_hour, end_hour')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        toast.error("Failed to load settings");
        return;
      }

      if (data) {
        setStartHour(data.start_hour.toString());
        setEndHour(data.end_hour.toString());
      }
    } catch (error) {
      console.error('Error in loadUserSettings:', error);
      toast.error("Failed to load settings");
    }
  }, []);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  const handleTimeChange = useCallback((newStartHour: string, newEndHour: string) => {
    setStartHour(newStartHour);
    setEndHour(newEndHour);
  }, []);

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full mb-6 bg-[#E5DEFF] p-1.5">
          <TabsTrigger 
            value="profile" 
            className="flex-1 gap-2 bg-[#E5DEFF] data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#8B5CF6]"
          >
            <UserRound className="w-4 h-4" />
            Profile
          </TabsTrigger>
          
          <TabsTrigger 
            value="appearance" 
            className="flex-1 bg-[#F2D9FF] data-[state=active]:bg-[#D946EF] data-[state=active]:text-white text-[#D946EF]"
          >
            Appearance
          </TabsTrigger>
          
          <TabsTrigger 
            value="calendar" 
            className="flex-1 bg-[#90C7F7] data-[state=active]:bg-[#0EA5E9] data-[state=active]:text-white text-[#0EA5E9]"
          >
            Calendar
          </TabsTrigger>
          
          <TabsTrigger 
            value="task-sharing" 
            className="flex-1 bg-[#E5DEFF] data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#8B5CF6]"
          >
            Task Sharing
          </TabsTrigger>

          <TabsTrigger 
            value="admin" 
            className="flex-1 bg-[#E5DEFF] data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#8B5CF6]"
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        
        <TabsContent value="calendar">
          <CalendarSettings
            initialStartHour={startHour}
            initialEndHour={endHour}
            onTimeChange={handleTimeChange}
          />
        </TabsContent>
        
        <TabsContent value="task-sharing">
          <TaskSharingSettings />
        </TabsContent>
        
        <TabsContent value="admin">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
