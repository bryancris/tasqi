
import { useCallback, useRef, useState } from 'react';
import { isIOSPWA } from '@/utils/platform-detection';

interface SwipeToCloseProps {
  onClose: () => void;
  isClosing: boolean;
  side: 'top' | 'right' | 'bottom' | 'left';
  threshold?: number;
  velocityThreshold?: number;
}

/**
 * Hook to implement swipe-to-close functionality for sheets and drawers
 */
export function useSwipeToClose({
  onClose,
  isClosing,
  side,
  threshold = 0.4, // 40% of the element's height/width
  velocityThreshold = 0.4 // px/ms
}: SwipeToCloseProps) {
  // Only support top and bottom sides for now
  const isVertical = side === 'top' || side === 'bottom';
  const shouldTrackSwipe = isVertical;
  
  // State for tracking swipe progress
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Refs for tracking touch/pointer events
  const startY = useRef(0);
  const startX = useRef(0);
  const currentY = useRef(0);
  const currentX = useRef(0);
  const startTime = useRef(0);
  const elementHeight = useRef(0);
  const touchId = useRef<number | null>(null);

  // Platform detection for iOS-specific optimizations
  const isIOSPwaApp = isIOSPWA();

  /**
   * Calculate transform based on swipe direction and offset
   */
  const getSwipeTransform = useCallback(() => {
    if (!isSwiping || Math.abs(swipeOffset) < 1) return '';
    
    if (side === 'bottom') {
      return `translateY(${swipeOffset}px)`;
    } else if (side === 'top') {
      return `translateY(${swipeOffset}px)`;
    }
    
    return '';
  }, [isSwiping, swipeOffset, side]);

  /**
   * Handle touch/pointer start event
   */
  const handleTouchStart = useCallback((e: React.TouchEvent | React.PointerEvent) => {
    if (isClosing || !shouldTrackSwipe) return;
    
    let clientY: number;
    let clientX: number;

    // Get coordinates based on event type
    if ('touches' in e) {
      // Touch event
      if (e.touches.length > 1) return; // Ignore multi-touch
      clientY = e.touches[0].clientY;
      clientX = e.touches[0].clientX;
      touchId.current = e.touches[0].identifier;
    } else {
      // Pointer event
      clientY = e.clientY;
      clientX = e.clientX;
      touchId.current = 1; // Use any non-null value
    }

    // Store initial position
    startY.current = clientY;
    startX.current = clientX;
    currentY.current = clientY;
    currentX.current = clientX;
    startTime.current = Date.now();
    
    // Get element's height for threshold calculation
    if (e.currentTarget instanceof HTMLElement) {
      elementHeight.current = e.currentTarget.offsetHeight;
    }

    setIsSwiping(true);
    setSwipeOffset(0);
  }, [isClosing, shouldTrackSwipe]);

  /**
   * Handle touch/pointer move event
   */
  const handleTouchMove = useCallback((e: React.TouchEvent | React.PointerEvent) => {
    if (!isSwiping || touchId.current === null) return;
    
    let clientY: number;
    let clientX: number;
    
    // Get coordinates based on event type
    if ('touches' in e) {
      // Find the touch point with the same identifier
      const touchPoint = Array.from(e.touches).find(
        touch => touch.identifier === touchId.current
      );
      if (!touchPoint) return;
      
      clientY = touchPoint.clientY;
      clientX = touchPoint.clientX;
    } else {
      clientY = e.clientY;
      clientX = e.clientX;
    }
    
    currentY.current = clientY;
    currentX.current = clientX;
    
    // Calculate delta
    const deltaY = clientY - startY.current;
    const deltaX = clientX - startX.current;
    
    // For bottom sheets, only allow downward swipes
    // For top sheets, only allow upward swipes
    if (side === 'bottom' && deltaY < 0) {
      setSwipeOffset(0);
      return;
    } else if (side === 'top' && deltaY > 0) {
      setSwipeOffset(0);
      return;
    }
    
    // Check if swipe is more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      // More of a horizontal swipe, ignore for vertical sheets
      if (isVertical) {
        return;
      }
    }
    
    // Apply resistance as the user swipes further
    let newOffset;
    if (side === 'bottom') {
      newOffset = deltaY > 0 ? deltaY * 0.8 : 0;
    } else if (side === 'top') {
      newOffset = deltaY < 0 ? deltaY * 0.8 : 0;
    } else {
      newOffset = 0;
    }
    
    setSwipeOffset(newOffset);
    
    // Prevent page scrolling while swiping
    if (Math.abs(newOffset) > 5) {
      e.preventDefault();
    }
  }, [isSwiping, side, isVertical]);

  /**
   * Handle touch/pointer end event
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent | React.PointerEvent) => {
    if (!isSwiping || touchId.current === null) return;
    
    // Calculate velocity (px/ms)
    const endTime = Date.now();
    const time = endTime - startTime.current;
    const distance = Math.abs(currentY.current - startY.current);
    const velocity = time > 0 ? distance / time : 0;
    
    // Calculate progress as percentage of element height
    const progress = elementHeight.current > 0 
      ? Math.abs(swipeOffset) / elementHeight.current
      : 0;
    
    // Check if swipe is complete (either by distance or velocity)
    const swipeThresholdMet = progress > threshold;
    const velocityThresholdMet = velocity > velocityThreshold;
    
    if (swipeThresholdMet || velocityThresholdMet) {
      // Close the sheet
      onClose();
    } else {
      // Reset to original position
      setSwipeOffset(0);
    }
    
    // Reset state
    setIsSwiping(false);
    touchId.current = null;
  }, [isSwiping, swipeOffset, onClose, threshold, velocityThreshold]);

  /**
   * Handle cancellation of touch/pointer (e.g., alert popup)
   */
  const handleTouchCancel = useCallback(() => {
    setIsSwiping(false);
    setSwipeOffset(0);
    touchId.current = null;
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    swipeTransform: getSwipeTransform(),
    isSwiping
  };
}
