
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
import { ShareTaskDialog } from "./ShareTaskDialog";

interface TaskCardProps {
  task: Task;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
  onComplete?: () => void;
}

export function TaskCard({ task, index, isDraggable = false, view = 'daily', onComplete }: TaskCardProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
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
      if (isUpdating) return;
      setIsUpdating(true);
      console.log('Attempting to update task:', task.id);

      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: task.status === 'completed' ? 'unscheduled' : 'completed',
          completed_at: task.status === 'completed' ? null : new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task:', error);
        toast.error(error.message || 'Failed to update task status');
        return;
      }

      if (onComplete) {
        onComplete();
      }

      toast.success(task.status === 'completed' ? 'Task uncompleted' : 'Task completed');
      console.log('Task update successful');
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error(error.message || 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const dragHandleProps = isDraggable ? {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
  } : {};

  const renderCard = () => {
    const cardProps = {
      task,
      onClick: handleClick,
      onComplete: handleComplete,
      dragHandleProps
    };

    switch (view) {
      case 'weekly':
        return <WeeklyTaskCard {...cardProps} />;
      case 'monthly':
        return <MonthlyTaskCard {...cardProps} />;
      default:
        return <DailyTaskCard {...cardProps} />;
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
      <ShareTaskDialog
        task={task}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </>
  );
}
