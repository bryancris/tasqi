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
import { useState } from "react";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { format } from "date-fns";

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

  const getTimeDisplay = (task: Task) => {
    if (task.start_time && task.end_time) {
      return `${task.start_time} - ${task.end_time}`;
    }
    return '';
  };

  const getCompletionDate = (task: Task) => {
    if (task.completed_at) {
      return format(new Date(task.completed_at), 'MMM d, yyyy');
    }
    return '';
  };

  if (isMobile) {
    return (
      <>
        <div 
          className={cn(
            "p-4 rounded-xl flex items-center justify-between text-white w-full cursor-pointer",
            task.status === 'unscheduled' ? 'bg-blue-500' : 
            task.status === 'completed' ? 'bg-gray-500' :
            getPriorityColor(task.priority)
          )}
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-3">
            <GripVertical className="h-5 w-5 text-white/50 cursor-grab" />
            <MobileTaskContent 
              title={task.title}
              time={getTimeDisplay(task)}
              status={task.status}
            />
          </div>
          <div className="flex flex-col items-end">
            {task.status === 'completed' && task.completed_at && (
              <span className="text-xs text-white/80">
                Completed {getCompletionDate(task)}
              </span>
            )}
            <TaskStatusIndicator
              status={task.status}
              time={getTimeDisplay(task)}
              onClick={(e) => {
                e.stopPropagation();
                if (task.status !== 'completed') {
                  handleComplete();
                }
              }}
            />
          </div>
        </div>
        <EditTaskDrawer 
          task={task} 
          open={isEditDrawerOpen} 
          onOpenChange={setIsEditDrawerOpen} 
        />
      </>
    );
  }

  return (
    <>
      <div 
        className={cn(
          "p-4 rounded-lg flex items-center justify-between text-white cursor-pointer",
          task.status === 'unscheduled' ? 'bg-blue-500' : 
          task.status === 'completed' ? 'bg-gray-500' :
          getPriorityColor(task.priority)
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 flex-1">
          <GripVertical className="h-5 w-5 text-white/50 cursor-grab" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className={cn("font-medium", task.status === 'completed' && "line-through")}>{task.title}</h3>
              {task.status === 'scheduled' && (
                <span className="text-sm">{getTimeDisplay(task)}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <p className={cn("text-sm mt-1 capitalize", task.status === 'completed' && "line-through")}>
                Status: {task.status}
              </p>
              {task.status === 'completed' && task.completed_at && (
                <span className="text-sm text-white/80">
                  Completed {getCompletionDate(task)}
                </span>
              )}
            </div>
          </div>
        </div>
        {task.status !== 'completed' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleComplete();
            }}
          >
            <TaskStatusIndicator
              status={task.status}
              time={getTimeDisplay(task)}
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
            />
          </Button>
        )}
      </div>
      <EditTaskDrawer 
        task={task} 
        open={isEditDrawerOpen} 
        onOpenChange={setIsEditDrawerOpen} 
      />
    </>
  );
}