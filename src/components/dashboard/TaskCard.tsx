import { Button } from "@/components/ui/button";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, TaskPriority } from "./TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface TaskCardProps {
  task: Task;
  isMobile?: boolean;
}

const getUrgencyColor = (time: string) => {
  if (!time) return 'bg-white/20'; // For unscheduled tasks
  
  const [startTime] = time.split(' - ');
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const taskTime = new Date();
  taskTime.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  const diffInHours = (taskTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours > 6) return 'bg-white';
  if (diffInHours > 4) return 'bg-yellow-500';
  if (diffInHours > 2) return 'bg-orange-500';
  return 'bg-red-500';
};

export function TaskCard({ task, isMobile = false }: TaskCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleComplete = async () => {
    if (task.status !== 'unscheduled') return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      // Invalidate and refetch tasks
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

  if (isMobile) {
    return (
      <div
        className={cn(
          "p-4 rounded-xl flex items-center justify-between text-white w-full",
          task.status === 'unscheduled' ? 'bg-blue-500' : getUrgencyColor(task.time)
        )}
      >
        <div className="flex items-center space-x-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-1 h-1 bg-white/50 rounded-full" />
            <div className="w-1 h-1 bg-white/50 rounded-full" />
            <div className="w-1 h-1 bg-white/50 rounded-full" />
            <div className="w-1 h-1 bg-white/50 rounded-full" />
          </div>
          <div>
            <h3 className="font-medium">{task.title}</h3>
            {task.status === 'scheduled' && (
              <p className="text-sm opacity-90">{task.time}</p>
            )}
          </div>
        </div>
        <div 
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full cursor-pointer shadow-lg",
            task.status === 'unscheduled' ? 'bg-white/20' : getUrgencyColor(task.time)
          )}
          onClick={task.status === 'unscheduled' ? handleComplete : undefined}
        >
          {task.status === 'unscheduled' ? (
            <Check className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4 text-white" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg flex items-center justify-between text-white",
        task.status === 'unscheduled' ? 'bg-blue-500' : getUrgencyColor(task.time)
      )}
    >
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{task.title}</h3>
          {task.status === 'scheduled' && (
            <span className="text-sm">{task.time}</span>
          )}
        </div>
        <p className="text-sm mt-1 capitalize">
          Status: {task.status}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn(
          "ml-2 rounded-full w-8 h-8 p-0 shadow-lg",
          task.status === 'unscheduled' 
            ? "hover:bg-white/20" 
            : getUrgencyColor(task.time)
        )}
        onClick={task.status === 'unscheduled' ? handleComplete : undefined}
      >
        {task.status === 'unscheduled' ? (
          <Check className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4 text-white" />
        )}
      </Button>
    </div>
  );
}