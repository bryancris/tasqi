import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, HeartHandshake, BookOpen, Smile, Coffee, Dumbbell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MentalWellnessActivity, MentalWellnessMeasurementUnit } from "@/types/mental-wellness";

const suggestedActivities = [
  {
    title: "Meditation",
    description: "Practice mindfulness and meditation",
    icon: Brain,
    color: "text-purple-500",
    gradient: "from-purple-500 to-indigo-500",
    defaultUnit: "minutes" as MentalWellnessMeasurementUnit,
  },
  {
    title: "Therapy Session",
    description: "Track your therapy sessions",
    icon: HeartHandshake,
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    defaultUnit: "hours" as MentalWellnessMeasurementUnit,
  },
  {
    title: "Journaling",
    description: "Write down your thoughts and feelings",
    icon: BookOpen,
    color: "text-teal-500",
    gradient: "from-teal-500 to-emerald-500",
    defaultUnit: "minutes" as MentalWellnessMeasurementUnit,
  },
  {
    title: "Mood Tracking",
    description: "Monitor your daily mood",
    icon: Smile,
    color: "text-yellow-500",
    gradient: "from-yellow-500 to-orange-500",
    defaultUnit: "count" as MentalWellnessMeasurementUnit,
  },
  {
    title: "Break Time",
    description: "Track mental breaks and relaxation",
    icon: Coffee,
    color: "text-red-500",
    gradient: "from-red-500 to-pink-500",
    defaultUnit: "minutes" as MentalWellnessMeasurementUnit,
  },
  {
    title: "Mindful Movement",
    description: "Yoga and mindful exercises",
    icon: Dumbbell,
    color: "text-green-500",
    gradient: "from-green-500 to-lime-500",
    defaultUnit: "minutes" as MentalWellnessMeasurementUnit,
  },
];

const measurementUnits: MentalWellnessMeasurementUnit[] = ['minutes', 'hours', 'count'];

export function MentalWellbeingContent() {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customActivity, setCustomActivity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<MentalWellnessMeasurementUnit>("count");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities } = useQuery({
    queryKey: ['mental-wellness-activities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('mental_wellness_activities')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as MentalWellnessActivity[];
    }
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: { activity_name: string; measurement_unit: MentalWellnessMeasurementUnit }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('mental_wellness_activities')
        .insert({
          activity_name: data.activity_name,
          activity_type: 'custom',
          measurement_unit: data.measurement_unit,
          user_id: user.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mental-wellness-activities'] });
      setCustomActivity("");
      setIsAddingCustom(false);
      toast({
        title: "Activity Added",
        description: `${customActivity} has been added to your tracking list.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddSuggestedActivity = async (activity: typeof suggestedActivities[0]) => {
    try {
      await addActivityMutation.mutateAsync({
        activity_name: activity.title,
        measurement_unit: activity.defaultUnit,
      });
    } catch (error) {
      console.error('Error adding suggested activity:', error);
    }
  };

  const handleAddCustomActivity = () => {
    if (customActivity.trim()) {
      addActivityMutation.mutate({
        activity_name: customActivity,
        measurement_unit: selectedUnit,
      });
    }
  };

  const isActivityAdded = (activityName: string) => {
    return activities?.some(activity => activity.activity_name === activityName);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent">
          Mental Wellbeing Tracking
        </h1>
        <p className="text-muted-foreground">
          Track your mental wellness activities and maintain emotional balance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {suggestedActivities.map((activity) => {
          const Icon = activity.icon;
          const isAdded = isActivityAdded(activity.title);
          
          return (
            <Card
              key={activity.title}
              className="overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              onClick={() => !isAdded && handleAddSuggestedActivity(activity)}
            >
              <div className={`h-full bg-gradient-to-r ${activity.gradient} p-0.5`}>
                <div className="bg-white dark:bg-gray-950 p-4 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-white dark:bg-gray-900 shadow-lg">
                        <Icon className={`w-6 h-6 ${activity.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                    {isAdded && (
                      <span className="text-sm text-muted-foreground">Added ✓</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={isAddingCustom} onOpenChange={setIsAddingCustom}>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] text-white hover:opacity-90"
          >
            Add Custom Activity
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Name</Label>
              <Input
                id="activity"
                placeholder="Enter activity name"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Measurement Unit</Label>
              <Select value={selectedUnit} onValueChange={(value) => setSelectedUnit(value as MentalWellnessMeasurementUnit)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {measurementUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#D946EF] text-white hover:opacity-90"
              onClick={handleAddCustomActivity}
              disabled={!customActivity.trim()}
            >
              Add Activity
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
