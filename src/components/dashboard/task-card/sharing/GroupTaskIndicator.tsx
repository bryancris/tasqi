
import { memo } from "react";
import { Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { TaskSharingInfoSheet } from "../components/TaskSharingInfoSheet";
import { getSharingBaseProps, handleSharingInteraction } from "../utils/sharingUtils";

/**
 * GroupTaskIndicator
 * 
 * This component displays an indicator for tasks that are shared with a group.
 * It shows a Users icon with "Group" text and provides additional information
 * through either a tooltip (on desktop) or a slide-up sheet (on mobile).
 * 
 * The component is optimized with memo to prevent unnecessary re-renders.
 */

interface GroupTaskIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  isMobile: boolean;
  showSharingInfo: boolean;
  setShowSharingInfo: (show: boolean) => void;
}

function GroupTaskIndicatorComponent({
  task,
  assignmentInfo,
  isMobile,
  showSharingInfo,
  setShowSharingInfo
}: GroupTaskIndicatorProps) {
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
          <Users className="w-4 h-4 text-[#22C55E]" />
          <span className="text-xs truncate">Group</span>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${baseProps.className} ${baseProps.cursor}`}>
                <Users className="w-4 h-4 text-[#22C55E]" />
                <span className="text-xs truncate">Group</span>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              align="center"
              className="bg-gray-800 text-white border-gray-700 text-xs z-50"
              sideOffset={5}
            >
              Shared with group
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

export const GroupTaskIndicator = memo(GroupTaskIndicatorComponent);
