
import { Task } from "../../TaskBoard";
import { TaskAssignmentInfo } from "../types";
import { addEventBlockers } from "@/components/ui/sheet/sheet-utils";
import { isIOSPWA } from "@/utils/platform-detection";

// Define custom interface for mouse/touch events
interface ExtendedMouseEvent extends React.MouseEvent {
  __sharingIndicatorHandled?: boolean;
}

interface ExtendedTouchEvent extends React.TouchEvent {
  __sharingIndicatorHandled?: boolean;
}

export function isGroupTask(task: Task): boolean {
  return !!task.shared_tasks?.some(st => st.sharing_type === 'group');
}

export function handleSharingInteraction(
  e: ExtendedMouseEvent | ExtendedTouchEvent, 
  isMobile: boolean, 
  setShowSharingInfo: (show: boolean) => void
): void {
  // Stop all event propagation
  if (e.stopPropagation) e.stopPropagation();
  if (e.preventDefault) e.preventDefault();
  
  // Stop native event propagation
  if (e.nativeEvent) {
    if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
    if (e.nativeEvent.stopPropagation) e.nativeEvent.stopPropagation();
    if (e.nativeEvent.preventDefault) e.nativeEvent.preventDefault();
  }
  
  // Add special data attributes
  if (e.target instanceof Element) {
    e.target.setAttribute('data-sharing-indicator-clicked', 'true');
  }
  
  // Mark the event as handled
  e.__sharingIndicatorHandled = true;
  
  // Create global flags
  (window as any).__sharingIndicatorClicked = true;
  (window as any).__sharingIndicatorClickTime = Date.now();
  
  // Use longer protection duration for iOS PWA
  const isIOSPwaApp = isIOSPWA();
  const blockDuration = isIOSPwaApp ? 2000 : 1000;
  
  // Add event blockers
  addEventBlockers(blockDuration);
  
  // Use requestAnimationFrame to ensure DOM updates
  requestAnimationFrame(() => {
    if (isMobile || isIOSPwaApp) { // Always show sheet for iOS PWA
      console.log('Opening sharing info sheet - mobile/PWA interaction');
      setShowSharingInfo(true);
    } else {
      if (e.type === 'click') {
        setShowSharingInfo(true);
      }
    }
  });
  
  // Blur any active elements
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

export function getSharingBaseProps(
  isMobile: boolean,
  handleInteraction: (e: React.MouseEvent | React.TouchEvent) => void
): {
  className: string;
  onClick?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  cursor: string;
  "data-sharing-indicator": string;
  "aria-label": string;
} {
  const isIOSPwaApp = isIOSPWA();
  
  return {
    className: "flex items-center gap-1 text-white/80 sharing-indicator",
    onClick: handleInteraction,
    onTouchStart: isIOSPwaApp ? handleInteraction : undefined, // Add touchstart for iOS PWA
    cursor: isMobile ? "cursor-pointer" : "cursor-help",
    "data-sharing-indicator": "true",
    "aria-label": "Sharing information"
  };
}
