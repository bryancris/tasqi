
import { memo } from "react";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { TaskCardProps } from "./types";
import { useTaskAssignmentInfo } from "./useTaskAssignmentInfo";
import { getTimeDisplay, getCardColor } from "./taskCardUtils";
import { TaskCardContent } from "./components/TaskCardContent";
import { ShareIndicator } from "./components/ShareIndicator";

function DailyTaskCardComponent({ task, onComplete, onClick, dragHandleProps, extraButton }: TaskCardProps) {
  const assignmentInfo = useTaskAssignmentInfo(task);
  const timeDisplay = getTimeDisplay(task);
  
  // Get the color based on task status
  const backgroundColor = getCardColor(task);

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl relative",
        "transition-all duration-300",
        "shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
        "hover:-translate-y-1",
        "cursor-pointer",
        backgroundColor,
        "text-white",
        "before:content-[''] before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
        "before:pointer-events-none",
        "border border-white/20"
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <TaskStatusIndicator 
        status={task.status} 
        time={timeDisplay}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      
      <TaskCardContent
        task={task}
        timeDisplay={timeDisplay}
        assignmentInfo={assignmentInfo}
        extraButton={extraButton}
      />
      
      <ShareIndicator task={task} assignmentInfo={assignmentInfo} />
    </div>
  );
}

export const DailyTaskCard = memo(DailyTaskCardComponent);
