
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppearanceSettings } from "./appearance/AppearanceSettings";
import { CalendarSettings } from "./calendar/CalendarSettings";
import { TaskSharingSettings } from "./task-sharing/TaskSharingSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsContent() {
  const [startHour, setStartHour] = useState<string>("8");
  const [endHour, setEndHour] = useState<string>("17");

  // Load user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('start_hour, end_hour')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading settings:', error);
        toast.error("Failed to load settings");
        return;
      }

      if (data) {
        setStartHour(data.start_hour.toString());
        setEndHour(data.end_hour.toString());
      }
    };

    loadUserSettings();
  }, []);

  return (
    <div className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
          <TabsTrigger value="task-sharing" className="flex-1">Task Sharing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        
        <TabsContent value="calendar">
          <CalendarSettings
            initialStartHour={startHour}
            initialEndHour={endHour}
          />
        </TabsContent>
        
        <TabsContent value="task-sharing">
          <TaskSharingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
