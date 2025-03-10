
import { memo } from "react";
import { Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { TaskSharingInfoSheet } from "./TaskSharingInfoSheet";
import { getSharingBaseProps, handleSharingInteraction } from "../utils/sharingUtils";
import { isIOSPWA } from "@/utils/platform-detection";

interface AssignedToMeIndicatorProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
  isMobile: boolean;
  showSharingInfo: boolean;
  setShowSharingInfo: (show: boolean) => void;
}

function AssignedToMeIndicatorComponent({
  task,
  assignmentInfo,
  isMobile,
  showSharingInfo,
  setShowSharingInfo
}: AssignedToMeIndicatorProps) {
  const { assignerName } = assignmentInfo;
  const isIOSPwaApp = isIOSPWA();

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    console.log(`Sharing indicator interaction: ${e.type}`);
    handleSharingInteraction(e, isMobile || isIOSPwaApp, setShowSharingInfo);
  };

  const baseProps = getSharingBaseProps(isMobile || isIOSPwaApp, handleInteraction);

  return (
    <>
      {(isMobile || isIOSPwaApp) ? (
        <div 
          {...baseProps}
          role="button"
          tabIndex={0}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-xs truncate">From</span>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                {...baseProps}
                role="button"
                tabIndex={0}
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
              {assignerName ? `From ${assignerName}` : "Loading..."}
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

export const AssignedToMeIndicator = memo(AssignedToMeIndicatorComponent);
