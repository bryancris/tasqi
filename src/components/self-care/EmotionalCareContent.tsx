
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Plus, Frown, Smile, Angry, Meh } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmotionalLog {
  id: number;
  emotion: string;
  intensity: number;
  notes: string | null;
  coping_strategy: string | null;
  date_logged: string;
}

const emotions = [
  { name: "Happy", icon: Smile, color: "text-green-500" },
  { name: "Sad", icon: Frown, color: "text-blue-500" },
  { name: "Angry", icon: Angry, color: "text-red-500" },
  { name: "Neutral", icon: Meh, color: "text-gray-500" },
];

export function EmotionalCareContent() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmotionalLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newLog, setNewLog] = useState({
    emotion: "",
    intensity: "3",
    notes: "",
    coping_strategy: "",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
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
    const { error } = await supabase.from("emotional_care_activities").insert([
      {
        emotion: newLog.emotion,
        intensity: parseInt(newLog.intensity),
        notes: newLog.notes,
        coping_strategy: newLog.coping_strategy,
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
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Emotional Care Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="emotion">Emotion</Label>
                  <Select
                    value={newLog.emotion}
                    onValueChange={(value) =>
                      setNewLog({ ...newLog, emotion: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select emotion" />
                    </SelectTrigger>
                    <SelectContent>
                      {emotions.map((emotion) => (
                        <SelectItem key={emotion.name} value={emotion.name}>
                          {emotion.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="intensity">Intensity (1-5)</Label>
                  <Select
                    value={newLog.intensity}
                    onValueChange={(value) =>
                      setNewLog({ ...newLog, intensity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newLog.notes}
                    onChange={(e) =>
                      setNewLog({ ...newLog, notes: e.target.value })
                    }
                    placeholder="How are you feeling?"
                  />
                </div>
                <div>
                  <Label htmlFor="coping">Coping Strategy</Label>
                  <Input
                    id="coping"
                    value={newLog.coping_strategy}
                    onChange={(e) =>
                      setNewLog({ ...newLog, coping_strategy: e.target.value })
                    }
                    placeholder="What helps you cope?"
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {logs.map((log) => {
            const emotion = emotions.find((e) => e.name === log.emotion);
            const Icon = emotion?.icon || Heart;
            return (
              <Card key={log.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full bg-white dark:bg-gray-900 shadow-lg`}>
                    <Icon className={`w-6 h-6 ${emotion?.color || "text-pink-500"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {log.emotion}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        Intensity: {log.intensity}/5
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.notes}
                      </p>
                    )}
                    {log.coping_strategy && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Coping Strategy: {log.coping_strategy}
                      </p>
                    )}
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
