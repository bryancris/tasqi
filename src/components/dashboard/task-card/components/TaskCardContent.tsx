
import { memo } from "react";
import { TaskCardTitle } from "./TaskCardTitle";
import { TaskCardIcons } from "./TaskCardIcons";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";

interface TaskCardContentProps {
  task: Task;
  timeDisplay: string;
  assignmentInfo: TaskAssignmentInfo;
  extraButton?: React.ReactNode;
}

function TaskCardContentComponent({ task, timeDisplay, assignmentInfo, extraButton }: TaskCardContentProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <TaskCardTitle task={task} />
        <TaskCardIcons 
          task={task} 
          assignmentInfo={assignmentInfo} 
          extraButton={extraButton}
        />
      </div>
      {timeDisplay && (
        <p className="text-sm mt-1 text-white/80">{timeDisplay}</p>
      )}
    </div>
  );
}

export const TaskCardContent = memo(TaskCardContentComponent);
