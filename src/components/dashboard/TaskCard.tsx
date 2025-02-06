import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "./TaskBoard";
import { WeeklyTaskCard } from "./task-card/WeeklyTaskCard";
import { DailyTaskCard } from "./task-card/DailyTaskCard";
import { MonthlyTaskCard } from "./task-card/MonthlyTaskCard";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
  onComplete?: () => void;
}

export function TaskCard({ task, index, isDraggable = false, view = 'daily', onComplete }: TaskCardProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  
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
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const handleClick = () => {
    setIsEditDrawerOpen(true);
  };

  const handleComplete = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: task.status === 'completed' ? 'unscheduled' : 'completed',
          completed_at: task.status === 'completed' ? null : new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      if (onComplete) {
        onComplete();
      }

      toast.success(task.status === 'completed' ? 'Task uncompleted' : 'Task completed');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to update task status');
    }
  };

  const dragHandleProps = isDraggable ? {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
  } : {};

  const renderCard = () => {
    switch (view) {
      case 'weekly':
        return (
          <WeeklyTaskCard
            task={task}
            onClick={handleClick}
            onComplete={handleComplete}
            dragHandleProps={dragHandleProps}
          />
        );
      case 'monthly':
        return (
          <MonthlyTaskCard
            task={task}
            onClick={handleClick}
            onComplete={handleComplete}
            dragHandleProps={dragHandleProps}
          />
        );
      default:
        return (
          <DailyTaskCard
            task={task}
            onClick={handleClick}
            onComplete={handleComplete}
            dragHandleProps={dragHandleProps}
          />
        );
    }
  };

  return (
    <>
      <div className={cn(
        "transition-all duration-200",
        isDragging && "opacity-50"
      )}>
        {renderCard()}
      </div>
      <EditTaskDrawer
        task={task}
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
      />
    </>
  );
}