import { Task } from "./TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { MobileTaskCard } from "./task-card/MobileTaskCard";
import { DesktopTaskCard } from "./task-card/DesktopTaskCard";

interface TaskCardProps {
  task: Task;
  isMobile?: boolean;
  index: number;
}

export function TaskCard({ task, isMobile = false, index }: TaskCardProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: "Task completed!",
        description: `${task.title} has been marked as complete`,
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = () => {
    setIsEditDrawerOpen(true);
  };

  const CardComponent = isMobile ? MobileTaskCard : DesktopTaskCard;

  return (
    <>
      <div onClick={handleCardClick}>
        <CardComponent task={task} onComplete={handleComplete} />
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
}