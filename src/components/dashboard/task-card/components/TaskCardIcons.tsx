
import { memo } from "react";
import { Bell, Mic, Paperclip, Sun } from "lucide-react";
import { Task } from "../../TaskBoard";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { hasVoiceNote, hasFileAttachments } from "../taskCardUtils";
import { TaskAssignmentIcons } from "../TaskAssignmentIcons";
import { TaskAssignmentInfo } from "../types";

interface TaskCardIconsProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  extraButton?: React.ReactNode;
}

function TaskCardIconsComponent({ task, assignmentInfo, extraButton }: TaskCardIconsProps) {
  const hasAudioAttachment = hasVoiceNote(task);
  const hasFiles = hasFileAttachments(task);
  
  // Fix: Only show sun icon for scheduled tasks that are marked as all-day
  // This ensures unscheduled tasks don't show the sun icon
  const isAllDay = task.is_all_day && task.date && task.status !== 'unscheduled';

  return (
    <div className="flex items-center gap-2">
      {isAllDay && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Sun className="w-4 h-4 text-[#F97316]" />
            </TooltipTrigger>
            <TooltipContent 
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              side="top"
              sideOffset={5}
            >
              All-day event
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {task.reminder_enabled && (
        <Bell className="w-4 h-4 text-white shrink-0" />
      )}
      {hasAudioAttachment && (
        <Mic className="w-4 h-4 text-white" />
      )}
      {hasFiles && (
        <Paperclip className="w-4 h-4 text-white" />
      )}
      <TaskAssignmentIcons 
        task={task} 
        assignmentInfo={assignmentInfo} 
      />
      {extraButton}
    </div>
  );
}

export const TaskCardIcons = memo(TaskCardIconsComponent);
