
import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { TaskSharingInfoSheet } from "../components/TaskSharingInfoSheet";
import { getSharingBaseProps, handleSharingInteraction } from "../utils/sharingUtils";

/**
 * SharedByMeIndicator
 * 
 * This component displays an indicator showing that the current user has shared 
 * a task with another user. It shows an ArrowRight icon with "Assigned" text and
 * provides information about who the task was shared with through either a tooltip 
 * (on desktop) or a slide-up sheet (on mobile).
 * 
 * This differs from AssignedByMeIndicator in that it represents informal sharing
 * rather than a formal task assignment.
 * 
 * The component is optimized with memo to prevent unnecessary re-renders.
 */

interface SharedByMeIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  isMobile: boolean;
  showSharingInfo: boolean;
  setShowSharingInfo: (show: boolean) => void;
}

function SharedByMeIndicatorComponent({
  task,
  assignmentInfo,
  isMobile,
  showSharingInfo,
  setShowSharingInfo
}: SharedByMeIndicatorProps) {
  const { sharedWithName } = assignmentInfo;

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
              {sharedWithName ? `Assigned to ${sharedWithName}` : "Shared task"}
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

export const SharedByMeIndicator = memo(SharedByMeIndicatorComponent);
