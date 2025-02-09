
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
      
      const newStatus = task.status === 'completed' ? 'unscheduled' : 'completed';
      const completedAt = task.status === 'completed' ? null : new Date().toISOString();

      // First try direct update for tasks user owns
      let { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', task.id);

      if (updateError) {
        console.error('Error updating task:', updateError);
        if (task.shared) {
          // If task is shared and direct update failed, try updating through shared_tasks
          const { error: sharedUpdateError } = await supabase
            .from('shared_tasks')
            .update({ status: newStatus === 'completed' ? 'completed' : 'pending' })
            .eq('task_id', task.id)
            .eq('shared_with_user_id', (await supabase.auth.getUser()).data.user?.id);

          if (sharedUpdateError) {
            console.error('Error updating shared task:', sharedUpdateError);
            toast.error('You do not have permission to complete this task');
            return;
          }
        } else {
          toast.error('Failed to update task. Please try again.');
          return;
        }
      }

      toast.success(task.status === 'completed' ? 'Task uncompleted' : 'Task completed');

      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error('An unexpected error occurred while updating the task');
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
