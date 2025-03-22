
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define form validation schema
const measurementFormSchema = z.object({
  weight: z.string().optional(),
  bmi: z.string().optional(),
  bodyFat: z.string().optional(),
  muscleMass: z.string().optional(),
  waterPercentage: z.string().optional(),
  notes: z.string().optional(),
});

type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

// Define default values
const defaultValues: MeasurementFormValues = {
  weight: "",
  bmi: "",
  bodyFat: "",
  muscleMass: "",
  waterPercentage: "",
  notes: "",
};

export function BodyMeasurementsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Create form
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues,
  });

  // Query to get activity IDs
  const { data: activities } = useQuery({
    queryKey: ['body-measurement-activities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('physical_wellness_activities')
        .select('*')
        .eq('user_id', user.id)
        .in('activity_name', ['Weight', 'BMI', 'Body Fat', 'Muscle Mass', 'Water Percentage']);
      
      if (error) throw error;
      return data;
    }
  });

  // Log measurement values
  const logMeasurementMutation = useMutation({
    mutationFn: async (values: MeasurementFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      // Create array of log entries to insert
      const logEntries = [];

      // Get current date and time
      const loggedAt = new Date().toISOString();
      
      // Only add entries for non-empty values
      if (values.weight && activities) {
        const weightActivity = activities.find(a => a.activity_name === 'Weight');
        if (weightActivity) {
          logEntries.push({
            activity_id: weightActivity.id,
            user_id: user.id,
            value: parseFloat(values.weight),
            notes: values.notes,
            logged_at: loggedAt
          });
        }
      }
      
      if (values.bmi && activities) {
        const bmiActivity = activities.find(a => a.activity_name === 'BMI');
        if (bmiActivity) {
          logEntries.push({
            activity_id: bmiActivity.id,
            user_id: user.id,
            value: parseFloat(values.bmi),
            notes: values.notes,
            logged_at: loggedAt
          });
        }
      }
      
      if (values.bodyFat && activities) {
        const bodyFatActivity = activities.find(a => a.activity_name === 'Body Fat');
        if (bodyFatActivity) {
          logEntries.push({
            activity_id: bodyFatActivity.id,
            user_id: user.id,
            value: parseFloat(values.bodyFat),
            notes: values.notes,
            logged_at: loggedAt
          });
        }
      }
      
      if (values.muscleMass && activities) {
        const muscleMassActivity = activities.find(a => a.activity_name === 'Muscle Mass');
        if (muscleMassActivity) {
          logEntries.push({
            activity_id: muscleMassActivity.id,
            user_id: user.id,
            value: parseFloat(values.muscleMass),
            notes: values.notes,
            logged_at: loggedAt
          });
        }
      }
      
      if (values.waterPercentage && activities) {
        const waterActivity = activities.find(a => a.activity_name === 'Water Percentage');
        if (waterActivity) {
          logEntries.push({
            activity_id: waterActivity.id,
            user_id: user.id,
            value: parseFloat(values.waterPercentage),
            notes: values.notes,
            logged_at: loggedAt
          });
        }
      }
      
      // Only insert if we have at least one entry
      if (logEntries.length > 0) {
        const { error } = await supabase
          .from('physical_wellness_logs')
          .insert(logEntries);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-measurements-history'] });
      form.reset(defaultValues);
      toast({
        title: "Measurements logged",
        description: `Your body measurements for ${today} have been saved.`,
      });
    },
    onError: (error) => {
      console.error('Error logging measurements:', error);
      toast({
        title: "Error",
        description: "Failed to log measurements. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create default activities if they don't exist yet
  const createDefaultActivitiesMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Define default body measurement activities
      const defaultActivities = [
        { activity_name: 'Weight', measurement_unit: 'kilograms', activity_type: 'body_measurement' },
        { activity_name: 'BMI', measurement_unit: 'count', activity_type: 'body_measurement' },
        { activity_name: 'Body Fat', measurement_unit: 'percentage', activity_type: 'body_measurement' },
        { activity_name: 'Muscle Mass', measurement_unit: 'kilograms', activity_type: 'body_measurement' },
        { activity_name: 'Water Percentage', measurement_unit: 'percentage', activity_type: 'body_measurement' },
      ];
      
      // Add user_id to each activity
      const activitiesWithUserId = defaultActivities.map(activity => ({
        ...activity,
        user_id: user.id
      }));
      
      // Insert only activities that don't already exist
      const { error } = await supabase
        .from('physical_wellness_activities')
        .upsert(activitiesWithUserId, { 
          onConflict: 'user_id, activity_name',
          ignoreDuplicates: true
        });
      
      if (error) throw error;
      
      // Refetch activities
      queryClient.invalidateQueries({ queryKey: ['body-measurement-activities'] });
    }
  });

  // Call create activities mutation on first load if none exist
  const { isLoading } = useQuery({
    queryKey: ['initialize-body-measurement-activities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('physical_wellness_activities')
        .select('count')
        .eq('user_id', user.id)
        .eq('activity_type', 'body_measurement');
      
      if (error) throw error;
      
      if (data && data.length === 0) {
        await createDefaultActivitiesMutation.mutateAsync();
      }
      
      return true;
    }
  });

  const onSubmit = (values: MeasurementFormValues) => {
    logMeasurementMutation.mutate(values);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-[#FF719A] to-[#FF9F9F] bg-clip-text text-transparent">
          Log Body Measurements
        </h2>
        <p className="text-sm text-muted-foreground">
          Record your body measurements for {today}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter weight in kg" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bmi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BMI</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter BMI" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bodyFat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Fat %</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter body fat percentage" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="muscleMass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Muscle Mass (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter muscle mass" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="waterPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Water %</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="Enter water percentage" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Add any additional notes" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#FF719A] to-[#FF9F9F] text-white"
            disabled={logMeasurementMutation.isPending}
          >
            {logMeasurementMutation.isPending ? "Saving..." : "Save Measurements"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
