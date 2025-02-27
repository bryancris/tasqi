
import { memo } from "react";
import { Task } from "../TaskBoard";
import { TaskStatusIndicator } from "../TaskStatusIndicator";
import { cn } from "@/lib/utils";
import { Bell, Mic } from "lucide-react";
import { TaskCardProps } from "./types";
import { useTaskAssignmentInfo } from "./useTaskAssignmentInfo";
import { TaskAssignmentIcons } from "./TaskAssignmentIcons";
import { getTimeDisplay, getCardColor, hasVoiceNote } from "./taskCardUtils";

function DailyTaskCardComponent({ task, onComplete, onClick, dragHandleProps, extraButton }: TaskCardProps) {
  const assignmentInfo = useTaskAssignmentInfo(task);
  const timeDisplay = getTimeDisplay(task);
  const hasAudioAttachment = hasVoiceNote(task);

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl relative",
        "transition-all duration-300",
        "shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
        "hover:-translate-y-1",
        "cursor-pointer",
        getCardColor(task),
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
        rescheduleCount={task.reschedule_count}
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }} 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-medium truncate flex-1 text-white",
            task.status === 'completed' && "line-through opacity-80"
          )}>{task.title}</h3>
          <div className="flex items-center gap-2">
            {task.reminder_enabled && (
              <Bell className="w-4 h-4 text-white/80 shrink-0" />
            )}
            {hasAudioAttachment && (
              <Mic className="w-4 h-4 text-white/80" />
            )}
            <TaskAssignmentIcons 
              task={task} 
              assignmentInfo={assignmentInfo} 
            />
            {extraButton}
          </div>
        </div>
        {timeDisplay && (
          <p className="text-sm mt-1 text-white/80">{timeDisplay}</p>
        )}
      </div>
      {task.shared && (
        <div className="w-2 bg-[#8B5CF6] h-full absolute right-0 top-0 rounded-r-xl" />
      )}
    </div>
  );
}

export const DailyTaskCard = memo(DailyTaskCardComponent);
