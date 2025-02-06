import { Task } from "./TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { MobileTaskCard } from "./task-card/MobileTaskCard";
import { DailyTaskCard } from "./task-card/DailyTaskCard";
import { WeeklyTaskCard } from "./task-card/WeeklyTaskCard";
import { MonthlyTaskCard } from "./task-card/MonthlyTaskCard";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  isMobile?: boolean;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
}

export function TaskCard({ task, isMobile = false, index, isDraggable = true, view = 'daily' }: TaskCardProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const renderTaskCard = () => {
    if (isMobile) {
      return (
        <MobileTaskCard 
          task={task} 
          onComplete={handleComplete} 
          onClick={handleCardClick} 
          dragHandleProps={isDraggable ? listeners : undefined}
        />
      );
    }

    const props = {
      task,
      onComplete: handleComplete,
      onClick: handleCardClick,
      dragHandleProps: isDraggable ? listeners : undefined,
    };

    switch (view) {
      case 'weekly':
        return <WeeklyTaskCard {...props} />;
      case 'monthly':
        return <MonthlyTaskCard {...props} />;
      default:
        return <DailyTaskCard {...props} />;
    }
  };

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes}>
        {renderTaskCard()}
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
}