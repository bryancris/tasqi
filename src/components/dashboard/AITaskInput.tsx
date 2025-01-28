import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AITaskInput() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { data, error } = await supabase.functions.invoke('process-task', {
        body: { prompt, userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setPrompt("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your task in natural language (e.g., 'Schedule a meeting tomorrow at 2pm')"
        className="flex-1"
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        disabled={isLoading}
        className="bg-black hover:bg-gray-800 text-white"
      >
        {isLoading ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}