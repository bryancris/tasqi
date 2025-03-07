
import { useState, useEffect, useRef, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<any>;
  pullDownThreshold?: number;
  maxPullDownDistance?: number;
  refreshIndicatorHeight?: number;
  isPWA?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
  refreshIndicatorHeight = 40,
  isPWA = true
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const pullContainerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Check if current environment is iOS
  const isIOS = useRef(
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !(window as any).MSStream
  ).current;

  // Check if app is running in standalone mode (PWA)
  const isStandalone = useRef(
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  ).current;

  const shouldEnablePullToRefresh = isPWA ? isStandalone : true;

  // Handle pull start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh at the top of the page
    if (window.scrollY > 0) return;
    
    startYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  }, []);

  // Handle touch move for pull effect
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    
    // Only consider downward movement
    if (diff <= 0) {
      setPullDistance(0);
      return;
    }

    // Apply resistance to the pull
    const newDistance = Math.min(diff * 0.5, maxPullDownDistance);
    setPullDistance(newDistance);

    // Prevent default to disable browser's native pull-to-refresh on iOS
    if (isIOS && newDistance > 0) {
      e.preventDefault();
    }
  }, [isPulling, isRefreshing, maxPullDownDistance, isIOS]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isPulling || isRefreshing) return;
    
    if (pullDistance >= pullDownThreshold) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(refreshIndicatorHeight);
      
      // Execute refresh callback
      onRefresh()
        .finally(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 300); // Slight delay for better UX
        });
    } else {
      // Reset without refreshing
      setPullDistance(0);
    }
    
    setIsPulling(false);
  }, [
    isPulling, 
    isRefreshing, 
    pullDistance, 
    pullDownThreshold, 
    refreshIndicatorHeight, 
    onRefresh
  ]);

  // Set up event listeners
  useEffect(() => {
    if (!shouldEnablePullToRefresh) return;
    
    const contentElement = contentRef.current;
    if (!contentElement) return;
    
    contentElement.addEventListener('touchstart', handleTouchStart, { passive: !isIOS });
    contentElement.addEventListener('touchmove', handleTouchMove, { passive: !isIOS });
    contentElement.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      contentElement.removeEventListener('touchstart', handleTouchStart);
      contentElement.removeEventListener('touchmove', handleTouchMove);
      contentElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    shouldEnablePullToRefresh,
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd, 
    isIOS
  ]);

  // Prepare style for container
  const containerStyle = {
    position: 'relative' as const,
    overflow: 'visible' as const,
    height: '100%' as const,
  };

  // Prepare style for the refresh indicator
  const refreshIndicatorStyle = {
    height: `${refreshIndicatorHeight}px`,
    position: 'absolute' as const,
    top: `-${refreshIndicatorHeight}px`,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    visibility: pullDistance > 0 ? 'visible' : 'hidden',
    opacity: Math.min(pullDistance / pullDownThreshold, 1),
    transform: `translateY(${pullDistance > 0 ? pullDistance : 0}px)`
  };

  // Prepare style for the content
  const contentStyle = {
    transform: `translateY(${pullDistance}px)`,
    transition: isRefreshing || (!isPulling && pullDistance > 0)
      ? 'transform 0.2s ease-out'
      : 'none',
    height: '100%',
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const, // Enables momentum scrolling on iOS
  };

  return {
    containerRef: pullContainerRef,
    contentRef,
    isRefreshing,
    containerStyle,
    contentStyle,
    refreshIndicatorStyle,
    pullDistance,
  };
}
