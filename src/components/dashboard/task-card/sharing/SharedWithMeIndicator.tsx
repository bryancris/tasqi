
import { memo } from "react";
import { Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { TaskSharingInfoSheet } from "./TaskSharingInfoSheet";
import { getSharingBaseProps, handleSharingInteraction } from "../utils/sharingUtils";

/**
 * SharedWithMeIndicator
 * 
 * This component displays an indicator showing that a task has been shared with
 * the current user by another user. It shows a Share2 icon with "From" text and
 * provides information about who shared the task through either a tooltip 
 * (on desktop) or a slide-up sheet (on mobile).
 * 
 * This differs from AssignedToMeIndicator in that it represents informal sharing
 * rather than a formal task assignment.
 * 
 * The component is optimized with memo to prevent unnecessary re-renders.
 */

interface SharedWithMeIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  isMobile: boolean;
  showSharingInfo: boolean;
  setShowSharingInfo: (show: boolean) => void;
}

function SharedWithMeIndicatorComponent({
  task,
  assignmentInfo,
  isMobile,
  showSharingInfo,
  setShowSharingInfo
}: SharedWithMeIndicatorProps) {
  const { sharedByName } = assignmentInfo;

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
          data-sharing-indicator="true"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs truncate">From</span>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`${baseProps.className} ${baseProps.cursor}`}
                data-sharing-indicator="true"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs truncate">From</span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              align="center"
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              sideOffset={5}
            >
              {sharedByName ? `From ${sharedByName}` : "Received task"}
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

export const SharedWithMeIndicator = memo(SharedWithMeIndicatorComponent);
