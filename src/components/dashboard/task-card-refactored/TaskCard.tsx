
import { useState } from "react";
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
  
  const handleTaskComplete = async () => {
    const success = await handleComplete();
    
    if (success) {
      // Call the onComplete callback if provided
      if (onComplete) {
        await onComplete();
      }
    }
  };

  return (
    <TaskCardBase
      task={localTask}
      index={index}
      isDraggable={isDraggable}
      view={view}
      onComplete={handleTaskComplete}
    />
  );
}
