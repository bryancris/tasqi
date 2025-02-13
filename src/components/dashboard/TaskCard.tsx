
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
import { QueryObserverResult } from "@tanstack/react-query";

interface TaskCardProps {
  task: Task;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
  onComplete?: () => void | Promise<QueryObserverResult<Task[], Error>>;
}

export function TaskCard({ task, index, isDraggable = false, view = 'daily', onComplete }: TaskCardProps) {
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [localTaskStatus, setLocalTaskStatus] = useState(task.status);
  
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
      console.log('Attempting to complete task:', task.id);
      if (isUpdating) {
        console.log('Task update already in progress, skipping...');
        return;
      }
      
      setIsUpdating(true);
      console.log('Current task status:', task.status);
      
      const newStatus = task.status === 'completed' ? 'unscheduled' : 'completed';
      const completedAt = task.status === 'completed' ? null : new Date().toISOString();
      
      console.log('Updating task to:', { newStatus, completedAt });

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Optimistically update local state
      setLocalTaskStatus(newStatus);
      task.status = newStatus;
      task.completed_at = completedAt;

      if (task.shared) {
        console.log('Updating shared task');
        const { error: sharedUpdateError } = await supabase
          .from('shared_tasks')
          .update({ 
            status: newStatus === 'completed' ? 'completed' : 'pending'
          })
          .eq('task_id', task.id)
          .eq('shared_with_user_id', user.id);

        if (sharedUpdateError) {
          console.error('Error updating shared task:', sharedUpdateError);
          toast.error('Failed to update shared task status');
          // Revert local state on error
          setLocalTaskStatus(task.status);
          return;
        }
      } else {
        console.log('Updating owned task');
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ 
            status: newStatus,
            completed_at: completedAt
          })
          .eq('id', task.id);

        if (updateError) {
          console.error('Error updating task:', updateError);
          toast.error('Failed to update task status');
          // Revert local state on error
          setLocalTaskStatus(task.status);
          return;
        }
      }

      console.log('Task update successful');
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task uncompleted');

      // Call onComplete to trigger refetch
      if (onComplete) {
        await onComplete();
      }
    } catch (error: any) {
      console.error('Unexpected error completing task:', error);
      toast.error('An unexpected error occurred');
      // Revert local state on error
      setLocalTaskStatus(task.status);
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
      task: { ...task, status: localTaskStatus },
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
