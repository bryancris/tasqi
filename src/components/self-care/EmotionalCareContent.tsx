
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmotionalLogDialog } from "./emotional/EmotionalLogDialog";
import { EmotionalLogCard } from "./emotional/EmotionalLogCard";
import { EmotionalLog, EmotionalLogFormData } from "./emotional/types";

export function EmotionalCareContent() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmotionalLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newLog, setNewLog] = useState<EmotionalLogFormData>({
    emotion: "",
    intensity: "3",
    notes: "",
    coping_strategy: "",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      toast({
        title: "Error",
        description: "You must be logged in to view emotional care logs",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("emotional_care_activities")
      .select("*")
      .order("date_logged", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch emotional care logs",
        variant: "destructive",
      });
      return;
    }

    setLogs(data || []);
  };

  const handleSubmit = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      toast({
        title: "Error",
        description: "You must be logged in to create emotional care logs",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("emotional_care_activities").insert([
      {
        emotion: newLog.emotion,
        intensity: parseInt(newLog.intensity),
        notes: newLog.notes,
        coping_strategy: newLog.coping_strategy,
        user_id: sessionData.session.user.id,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save emotional care log",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Emotional care log saved successfully",
    });

    setIsOpen(false);
    fetchLogs();
    setNewLog({
      emotion: "",
      intensity: "3",
      notes: "",
      coping_strategy: "",
    });
  };

  return (
    <div className={isMobile ? "px-4 py-2" : "container mx-auto p-6"}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold mb-2 bg-gradient-to-r from-[#E11D48] to-[#FDA4AF] bg-clip-text text-transparent`}>
              Emotional Care
            </h1>
            <p className="text-muted-foreground">
              Track and understand your emotional well-being
            </p>
          </div>
          <EmotionalLogDialog
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            newLog={newLog}
            onLogChange={setNewLog}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {logs.map((log) => (
            <EmotionalLogCard key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}
