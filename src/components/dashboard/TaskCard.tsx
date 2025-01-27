import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task } from "./TaskBoard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getPriorityColor } from "@/utils/taskColors";
import { TaskStatusIndicator } from "./TaskStatusIndicator";
import { MobileTaskContent } from "./MobileTaskContent";
import { GripVertical } from "lucide-react";

interface TaskCardProps {
  task: Task;
  isMobile?: boolean;
  index: number;
}

export function TaskCard({ task, isMobile = false, index }: TaskCardProps) {
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
      <div className={cn(
        "p-4 rounded-xl flex items-center justify-between text-white w-full",
        task.status === 'unscheduled' ? 'bg-blue-500' : getPriorityColor(task.priority)
      )}>
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-white/50 cursor-grab" />
          <MobileTaskContent 
            title={task.title}
            time={task.time}
            status={task.status}
          />
        </div>
        <TaskStatusIndicator
          status={task.status}
          time={task.time}
          onClick={handleComplete}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg flex items-center justify-between text-white",
      task.status === 'unscheduled' ? 'bg-blue-500' : getPriorityColor(task.priority)
    )}>
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="h-5 w-5 text-white/50 cursor-grab" />
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
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 p-0"
      >
        <TaskStatusIndicator
          status={task.status}
          time={task.time}
          onClick={handleComplete}
        />
      </Button>
    </div>
  );
}