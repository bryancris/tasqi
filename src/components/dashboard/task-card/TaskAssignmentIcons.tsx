
import { Share2, ArrowRight, Users } from "lucide-react";
import { TaskAssignmentInfo } from "./types";
import { Task } from "../TaskBoard";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskSharingInfoSheet } from "./components/TaskSharingInfoSheet";

interface TaskAssignmentIconsProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

export function TaskAssignmentIcons({ task, assignmentInfo }: TaskAssignmentIconsProps) {
  const [showSharingInfo, setShowSharingInfo] = useState(false);
  const isMobile = useIsMobile();
  
  const {
    assignerName,
    assigneeName,
    sharedWithUser,
    sharedByUser,
    sharedWithName,
    sharedByName,
    currentUserId
  } = assignmentInfo;

  // For debugging
  console.log("TaskAssignmentIcons - task:", task.id, task.title);
  console.log("TaskAssignmentIcons - assignmentInfo:", {
    sharedByUser, 
    sharedWithUser, 
    sharedWithName, 
    sharedByName
  });

  // Check if it's a group task
  const isGroupTask = task.shared_tasks?.some(st => st.sharing_type === 'group');
  
  // Helper to handle click or hover based on device
  const handleInteraction = () => {
    if (isMobile) {
      setShowSharingInfo(true);
    }
  };
  
  if (isGroupTask) {
    return (
      <>
        {isMobile ? (
          <div 
            className="flex items-center gap-1 text-white/80 cursor-pointer" 
            onClick={handleInteraction}
          >
            <Users className="w-4 h-4 text-[#22C55E]" />
            <span className="text-xs truncate">Group</span>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-white/80 cursor-help">
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

  // Check for assignments first
  if (task.assignments?.length) {
    const assignment = task.assignments[0];
    
    // If I assigned this task to someone else
    if (assignment.assigned_by_id === currentUserId) {
      return (
        <>
          {isMobile ? (
            <div 
              className="flex items-center gap-1 text-white/80 cursor-pointer" 
              onClick={handleInteraction}
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs truncate">Assigned</span>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-white/80 cursor-help">
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
    
    // If someone assigned this task to me
    if (assignment.assignee_id === currentUserId) {
      return (
        <>
          {isMobile ? (
            <div 
              className="flex items-center gap-1 text-white/80 cursor-pointer" 
              onClick={handleInteraction}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs truncate">From</span>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-white/80 cursor-help">
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
  }

  // Check for shared tasks when there are no assignments
  // If I shared this task with someone (I'm the owner)
  if (sharedByUser) {
    return (
      <>
        {isMobile ? (
          <div 
            className="flex items-center gap-1 text-white/80 cursor-pointer" 
            onClick={handleInteraction}
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-xs truncate">Assigned</span>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-white/80 cursor-help">
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
  
  // If this task was shared with me
  if (sharedWithUser) {
    return (
      <>
        {isMobile ? (
          <div 
            className="flex items-center gap-1 text-white/80 cursor-pointer" 
            onClick={handleInteraction}
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs truncate">From</span>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-white/80 cursor-help">
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

  return null;
}
