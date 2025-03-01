
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Task } from "../../TaskBoard";

interface TaskCardTitleProps {
  task: Task;
}

function TaskCardTitleComponent({ task }: TaskCardTitleProps) {
  return (
    <h3 className={cn(
      "font-medium truncate flex-1 text-white",
      task.status === 'completed' && "line-through opacity-80"
    )}>
      {task.title}
    </h3>
  );
}

export const TaskCardTitle = memo(TaskCardTitleComponent);
