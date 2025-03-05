
import { useState, useEffect } from "react";
import { Task } from "../TaskBoard";
import { TaskCardBase } from "./TaskCardBase";
import { useTaskStatus } from "./useTaskStatus";
import { QueryObserverResult } from "@tanstack/react-query";

interface TaskCardProps {
  task: Task;
  index: number;
  isDraggable?: boolean;
  view?: 'daily' | 'weekly' | 'monthly';
  onComplete?: () => void | Promise<QueryObserverResult<Task[], Error>>;
}

export function TaskCard({ task, index, isDraggable = false, view = 'daily', onComplete }: TaskCardProps) {
  const [localTask, setLocalTask] = useState(task);
  const { handleComplete, isUpdating } = useTaskStatus(localTask);
  
  // Update local task when the prop changes
  useEffect(() => {
    setLocalTask(task);
  }, [task]);
  
  const handleTaskComplete = async () => {
    console.log('TaskCard: handling task completion for', localTask.title);
    
    const success = await handleComplete();
    
    if (success) {
      // Immediately update the local state for the UI
      setLocalTask(prev => ({
        ...prev,
        status: prev.status === 'completed' ? 'unscheduled' : 'completed',
        completed_at: prev.status === 'completed' ? null : new Date().toISOString()
      }));
      
      // Call the onComplete callback if provided
      if (onComplete) {
        try {
          console.log('Calling onComplete callback');
          await onComplete();
        } catch (error) {
          console.error('Error in onComplete callback:', error);
        }
      }
    } else {
      console.log('Task completion was not successful');
    }
  };

  // Debugging log to track task status changes
  useEffect(() => {
    if (task.shared) {
      console.log(`Shared TaskCard ${task.id} (${task.title}) status updated:`, task.status);
    }
  }, [task.id, task.status, task.title, task.shared]);

  return (
    <TaskCardBase
      task={localTask}
      index={index}
      isDraggable={isDraggable}
      view={view}
      onComplete={handleTaskComplete}
      isUpdating={isUpdating}
    />
  );
}
