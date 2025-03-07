
import { Task } from "../../../TaskBoard";
import { TaskAssignmentInfo } from "../../types";
import { Share2, ArrowRight, Users } from "lucide-react";
import { ReactNode } from "react";

/**
 * Sharing details utilities
 * 
 * This file contains helper functions for determining and generating sharing-related
 * information to be displayed across multiple components. It centralizes the logic
 * for creating consistent sharing details.
 */

interface SharingDetails {
  icon: ReactNode;
  title: string;
  description: string;
  time?: string;
}

/**
 * Determines the appropriate sharing details to display based on the task and assignment info
 * 
 * @param task The task object
 * @param assignmentInfo Information about the task's assignments and sharing
 * @returns Formatted sharing details including icon, title, description and timestamp
 */
export function getSharingDetails(task: Task, assignmentInfo: TaskAssignmentInfo): SharingDetails {
  const {
    assignerName,
    assigneeName,
    sharedWithUser,
    sharedByUser,
    sharedWithName,
    sharedByName,
    currentUserId
  } = assignmentInfo;

  // Check for assignments first
  if (task.assignments?.length) {
    const assignment = task.assignments[0];
    
    // If current user assigned this task to someone else
    if (assignment.assigned_by_id === currentUserId) {
      return {
        icon: <ArrowRight className="h-5 w-5 text-blue-500" />,
        title: "Task Assigned",
        description: assigneeName ? `You assigned this task to ${assigneeName}` : "You assigned this task",
        time: assignment.created_at ? new Date(assignment.created_at).toLocaleString() : undefined
      };
    }
    
    // If someone assigned this task to me
    if (assignment.assignee_id === currentUserId) {
      return {
        icon: <Share2 className="h-5 w-5 text-purple-500" />,
        title: "Task Received",
        description: assignerName ? `${assignerName} assigned this task to you` : "Someone assigned this task to you",
        time: assignment.created_at ? new Date(assignment.created_at).toLocaleString() : undefined
      };
    }
  }
  
  // For group tasks
  if (task.shared_tasks?.some(st => st.sharing_type === 'group')) {
    return {
      icon: <Users className="h-5 w-5 text-green-500" />,
      title: "Group Task",
      description: "This task is shared with your group",
      time: task.shared_tasks?.[0]?.created_at 
        ? new Date(task.shared_tasks[0].created_at).toLocaleString() 
        : undefined
    };
  }
  
  // If current user shared this task with someone
  if (sharedByUser) {
    return {
      icon: <ArrowRight className="h-5 w-5 text-blue-500" />,
      title: "Task Shared",
      description: sharedWithName ? `You shared this task with ${sharedWithName}` : "You shared this task",
      time: task.shared_tasks?.[0]?.created_at 
        ? new Date(task.shared_tasks[0].created_at).toLocaleString() 
        : undefined
    };
  }
  
  // If this task was shared with current user
  if (sharedWithUser) {
    return {
      icon: <Share2 className="h-5 w-5 text-purple-500" />,
      title: "Task Shared With You",
      description: sharedByName ? `${sharedByName} shared this task with you` : "Someone shared this task with you",
      time: task.shared_tasks?.[0]?.created_at 
        ? new Date(task.shared_tasks[0].created_at).toLocaleString() 
        : undefined
    };
  }
  
  // Generic fallback
  return {
    icon: <Share2 className="h-5 w-5 text-purple-500" />,
    title: "Shared Task",
    description: "This task is shared",
    time: undefined
  };
}
