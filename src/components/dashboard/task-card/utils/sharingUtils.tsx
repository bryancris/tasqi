
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";

/**
 * Determines if a task is shared with a group
 */
export function isGroupTask(task: Task): boolean {
  return !!task.shared_tasks?.some(st => st.sharing_type === 'group');
}

/**
 * Handles the interaction for sharing info display
 */
export function handleSharingInteraction(
  e: React.MouseEvent, 
  isMobile: boolean, 
  setShowSharingInfo: (show: boolean) => void
): void {
  // Stop propagation to prevent opening the task edit drawer
  e.stopPropagation();
  e.preventDefault();
  
  if (isMobile) {
    setShowSharingInfo(true);
  }
}

/**
 * Get base props based on sharing type for consistency across components
 */
export function getSharingBaseProps(
  isMobile: boolean,
  handleInteraction: (e: React.MouseEvent) => void
): {
  className: string;
  onClick?: (e: React.MouseEvent) => void;
  cursor: string;
} {
  return {
    className: "flex items-center gap-1 text-white/80",
    onClick: isMobile ? handleInteraction : undefined,
    cursor: isMobile ? "cursor-pointer" : "cursor-help"
  };
}
