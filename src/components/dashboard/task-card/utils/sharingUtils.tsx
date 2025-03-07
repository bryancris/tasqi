
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";

/**
 * Shared utilities for task sharing components
 * This file contains reusable functions used by various sharing indicator components
 * to provide consistent behavior and appearance.
 */

/**
 * Determines if a task is shared with a group
 * @param task The task to check for group sharing
 * @returns boolean indicating if the task is shared with a group
 */
export function isGroupTask(task: Task): boolean {
  return !!task.shared_tasks?.some(st => st.sharing_type === 'group');
}

/**
 * Handles the interaction for sharing info display
 * This function is used by all sharing indicator components to handle
 * click events and control the display of sharing information sheets
 * 
 * @param e The mouse event
 * @param isMobile Whether the app is running on mobile
 * @param setShowSharingInfo Function to control display of sharing info
 */
export function handleSharingInteraction(
  e: React.MouseEvent, 
  isMobile: boolean, 
  setShowSharingInfo: (show: boolean) => void
): void {
  // More aggressive prevention of event propagation
  e.stopPropagation();
  e.preventDefault();
  
  if (isMobile) {
    // For mobile, we show the sharing info sheet
    setShowSharingInfo(true);
  } else {
    // On desktop, the tooltip already shows info, but we could
    // still show the detailed sheet if clicked (not just hovered)
    if (e.type === 'click') {
      setShowSharingInfo(true);
    }
  }
  
  // Use a more forceful approach to stop clicks
  // This helps prevent the task edit drawer from opening
  setTimeout(() => {
    const clickBlocker = (evt: MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();
      document.removeEventListener('click', clickBlocker, true);
    };
    
    document.addEventListener('click', clickBlocker, { 
      capture: true, 
      once: true 
    });
  }, 0);
}

/**
 * Get base props based on sharing type for consistency across components
 * Provides consistent styling, cursor behavior, and click handling
 * for all sharing indicator components
 * 
 * @param isMobile Whether the app is running on mobile
 * @param handleInteraction The interaction handler function
 * @returns Common props to be spread into the component
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
    // On desktop, we want both click and hover behavior
    onClick: handleInteraction,
    cursor: isMobile ? "cursor-pointer" : "cursor-help"
  };
}
