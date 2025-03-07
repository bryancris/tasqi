
import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { TaskSharingInfoSheet } from "./TaskSharingInfoSheet";
import { getSharingBaseProps, handleSharingInteraction } from "../utils/sharingUtils";

/**
 * AssignedByMeIndicator
 * 
 * This component displays an indicator showing that the current user has assigned 
 * a task to another user. It shows an ArrowRight icon with "Assigned" text and
 * provides information about who the task was assigned to through either a tooltip 
 * (on desktop) or a slide-up sheet (on mobile).
 * 
 * The component is optimized with memo to prevent unnecessary re-renders.
 */

interface AssignedByMeIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  isMobile: boolean;
  showSharingInfo: boolean;
  setShowSharingInfo: (show: boolean) => void;
}

function AssignedByMeIndicatorComponent({
  task,
  assignmentInfo,
  isMobile,
  showSharingInfo,
  setShowSharingInfo
}: AssignedByMeIndicatorProps) {
  const { assigneeName } = assignmentInfo;

  const handleInteraction = (e: React.MouseEvent) => {
    handleSharingInteraction(e, isMobile, setShowSharingInfo);
  };

  const baseProps = getSharingBaseProps(isMobile, handleInteraction);

  return (
    <>
      {isMobile ? (
        <div 
          className={baseProps.className}
          onClick={baseProps.onClick}
        >
          <ArrowRight className="w-4 h-4" />
          <span className="text-xs truncate">Assigned</span>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${baseProps.className} ${baseProps.cursor}`}>
                <ArrowRight className="w-4 h-4" />
                <span className="text-xs truncate">Assigned</span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              align="center"
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              sideOffset={5}
            >
              {assigneeName ? `Assigned to ${assigneeName}` : "Loading..."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <TaskSharingInfoSheet
        task={task}
        assignmentInfo={assignmentInfo}
        open={showSharingInfo}
        onOpenChange={setShowSharingInfo}
      />
    </>
  );
}

export const AssignedByMeIndicator = memo(AssignedByMeIndicatorComponent);
