
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
  // Create multiple layers of event stopping to ensure propagation is truly halted
  e.stopPropagation();
  e.preventDefault();
  e.nativeEvent.stopImmediatePropagation();
  e.nativeEvent.stopPropagation();
  e.nativeEvent.preventDefault();
  
  // Set a flag to track this interaction
  const sharedDataId = `share-interaction-${Date.now()}`;
  (window as any).__lastShareInteraction = sharedDataId;
  
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
  
  // Use a more forceful approach to stop clicks by adding multiple event capture handlers
  const preventClicks = (evt: MouseEvent) => {
    evt.stopPropagation();
    evt.preventDefault();
    return false;
  };
  
  // Create a blocking layer that will capture ANY click in the next 500ms
  document.addEventListener('click', preventClicks, { capture: true });
  document.addEventListener('mousedown', preventClicks, { capture: true });
  document.addEventListener('mouseup', preventClicks, { capture: true });
  
  // Remove the blocking after a reasonable timeout
  setTimeout(() => {
    document.removeEventListener('click', preventClicks, { capture: true });
    document.removeEventListener('mousedown', preventClicks, { capture: true });
    document.removeEventListener('mouseup', preventClicks, { capture: true });
    
    // Clean up our tracking flag
    if ((window as any).__lastShareInteraction === sharedDataId) {
      (window as any).__lastShareInteraction = null;
    }
  }, 500);
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
