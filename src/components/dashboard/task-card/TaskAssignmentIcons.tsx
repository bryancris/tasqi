
import { useState } from "react";
import { Task } from "../TaskBoard";
import { TaskAssignmentInfo } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import { isGroupTask } from "./utils/sharingUtils";
import { GroupTaskIndicator } from "./sharing/GroupTaskIndicator";
import { AssignedByMeIndicator } from "./sharing/AssignedByMeIndicator";
import { AssignedToMeIndicator } from "./sharing/AssignedToMeIndicator";
import { SharedByMeIndicator } from "./sharing/SharedByMeIndicator";
import { SharedWithMeIndicator } from "./sharing/SharedWithMeIndicator";

interface TaskAssignmentIconsProps {
  task: Task;
  assignmentInfo: TaskAssignmentInfo;
}

export function TaskAssignmentIcons({ task, assignmentInfo }: TaskAssignmentIconsProps) {
  const [showSharingInfo, setShowSharingInfo] = useState(false);
  const isMobile = useIsMobile();
  
  const { currentUserId } = assignmentInfo;

  // For debugging
  console.log("TaskAssignmentIcons - task:", task.id, task.title);
  console.log("TaskAssignmentIcons - assignmentInfo:", {
    sharedByUser: assignmentInfo.sharedByUser, 
    sharedWithUser: assignmentInfo.sharedWithUser, 
    sharedWithName: assignmentInfo.sharedWithName, 
    sharedByName: assignmentInfo.sharedByName
  });

  // Check if it's a group task first
  if (isGroupTask(task)) {
    return (
      <GroupTaskIndicator
        task={task}
        assignmentInfo={assignmentInfo}
        isMobile={isMobile}
        showSharingInfo={showSharingInfo}
        setShowSharingInfo={setShowSharingInfo}
      />
    );
  }

  // Check for assignments
  if (task.assignments?.length) {
    const assignment = task.assignments[0];
    
    // If I assigned this task to someone else
    if (assignment.assigned_by_id === currentUserId) {
      return (
        <AssignedByMeIndicator
          task={task}
          assignmentInfo={assignmentInfo}
          isMobile={isMobile}
          showSharingInfo={showSharingInfo}
          setShowSharingInfo={setShowSharingInfo}
        />
      );
    }
    
    // If someone assigned this task to me
    if (assignment.assignee_id === currentUserId) {
      return (
        <AssignedToMeIndicator
          task={task}
          assignmentInfo={assignmentInfo}
          isMobile={isMobile}
          showSharingInfo={showSharingInfo}
          setShowSharingInfo={setShowSharingInfo}
        />
      );
    }
  }

  // Check for shared tasks when there are no assignments
  // If I shared this task with someone (I'm the owner)
  if (assignmentInfo.sharedByUser) {
    return (
      <SharedByMeIndicator
        task={task}
        assignmentInfo={assignmentInfo}
        isMobile={isMobile}
        showSharingInfo={showSharingInfo}
        setShowSharingInfo={setShowSharingInfo}
      />
    );
  }
  
  // If this task was shared with me
  if (assignmentInfo.sharedWithUser) {
    return (
      <SharedWithMeIndicator
        task={task}
        assignmentInfo={assignmentInfo}
        isMobile={isMobile}
        showSharingInfo={showSharingInfo}
        setShowSharingInfo={setShowSharingInfo}
      />
    );
  }

  return null;
}
