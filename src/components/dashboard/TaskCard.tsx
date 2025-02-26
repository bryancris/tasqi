
import { useState, useEffect } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

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
  const [localTask, setLocalTask] = useState(task);
  const queryClient = useQueryClient();

  // Update local task when the prop changes
  useEffect(() => {
    setLocalTask(task);
  }, [task]);
  
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
      console.log('Current task status:', localTask.status);
      
      const newStatus = localTask.status === 'completed' ? 'unscheduled' : 'completed';
      const completedAt = localTask.status === 'completed' ? null : new Date().toISOString();
      
      console.log('Updating task to:', { newStatus, completedAt });

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Optimistically update local state
      setLocalTask(prevTask => ({
        ...prevTask,
        status: newStatus,
        completed_at: completedAt
      }));

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
          setLocalTask(task);
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
          setLocalTask(task);
          return;
        }
      }

      console.log('Task update successful');
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task uncompleted');

      // Invalidate tasks query to trigger refresh
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });

    } catch (error: any) {
      console.error('Unexpected error completing task:', error);
      toast.error('An unexpected error occurred');
      // Revert local state on error
      setLocalTask(task);
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
      task: localTask,
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
        "transition-all duration-200 transform",
        "hover:translate-y-[-2px]",
        isDragging && "opacity-50 scale-105"
      )}>
        {renderCard()}
      </div>
      <EditTaskDrawer
        task={localTask}
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
      />
      <ShareTaskDialog
        task={localTask}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </>
  );
}
