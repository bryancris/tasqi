
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { addEventBlockers } from "@/components/ui/sheet/sheet-utils";

/**
 * Shared utilities for task sharing components
 * This file contains reusable functions used by various sharing indicator components
 * to provide consistent behavior and appearance.
 */

// Define custom interface for mouse events with our added properties
interface ExtendedMouseEvent extends React.MouseEvent {
  __sharingIndicatorHandled?: boolean;
}

/**
 * Determines if a task is shared with a group
 * @param task The task to check for group sharing
 * @returns boolean indicating if the task is shared with a group
 */
export function isGroupTask(task: Task): boolean {
  return !!task.shared_tasks?.some(st => st.sharing_type === 'group');
}

/**
 * Enhanced sharing interaction handler with more robust event blocking
 * 
 * @param e The mouse event
 * @param isMobile Whether the app is running on mobile
 * @param setShowSharingInfo Function to control display of sharing info
 */
export function handleSharingInteraction(
  e: ExtendedMouseEvent, 
  isMobile: boolean, 
  setShowSharingInfo: (show: boolean) => void
): void {
  // Enhanced event stopping to ensure propagation is truly halted
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  
  // Stop native event propagation for maximum protection
  if (e.nativeEvent) {
    if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
    if (e.nativeEvent.stopPropagation) e.nativeEvent.stopPropagation();
    if (e.nativeEvent.preventDefault) e.nativeEvent.preventDefault();
  }
  
  // Add special data attributes to identify this interaction
  if (e.target instanceof Element) {
    e.target.setAttribute('data-sharing-indicator-clicked', 'true');
  }
  
  // Mark the event as handled directly on the event object
  e.__sharingIndicatorHandled = true;
  
  // Create global flags to track this interaction - used by TaskCardBase
  window.__sharingIndicatorClicked = true;
  window.__sharingIndicatorClickTime = Date.now();
  
  // Add longer-lasting event blockers (1000ms instead of 150ms)
  addEventBlockers(1000);
  
  // Use requestAnimationFrame to ensure DOM updates before showing sharing info
  requestAnimationFrame(() => {
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
  });
  
  // Capture active elements to prevent default clicks
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
  
  // Add extra protection by blocking events in the capture phase
  // This ensures that no clicks get through to task cards underneath
  const preventCapture = (evt: Event) => {
    // Check if this event is within 1000ms of our sharing click
    const now = Date.now();
    const sharingClickTime = window.__sharingIndicatorClickTime || 0;
    
    if (now - sharingClickTime < 1000) {
      evt.stopPropagation();
      evt.preventDefault();
      return false;
    }
  };
  
  // Add these handlers with { capture: true } to intercept events early
  document.addEventListener('click', preventCapture, { capture: true });
  document.addEventListener('mousedown', preventCapture, { capture: true });
  document.addEventListener('mouseup', preventCapture, { capture: true });
  document.addEventListener('pointerdown', preventCapture, { capture: true });
  document.addEventListener('pointerup', preventCapture, { capture: true });
  
  // Remove the blocking after a reasonable timeout (1000ms instead of 300ms)
  setTimeout(() => {
    document.removeEventListener('click', preventCapture, { capture: true });
    document.removeEventListener('mousedown', preventCapture, { capture: true });
    document.removeEventListener('mouseup', preventCapture, { capture: true });
    document.removeEventListener('pointerdown', preventCapture, { capture: true });
    document.removeEventListener('pointerup', preventCapture, { capture: true });
    
    // Clean up our tracking flag
    window.__sharingIndicatorClicked = false;
    window.__sharingIndicatorClickTime = 0;
  }, 1000);
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
  "data-sharing-indicator": string;
  "aria-label": string;
} {
  return {
    className: "flex items-center gap-1 text-white/80 sharing-indicator",
    onClick: handleInteraction,
    cursor: isMobile ? "cursor-pointer" : "cursor-help",
    "data-sharing-indicator": "true",
    "aria-label": "Sharing information"
  };
}
