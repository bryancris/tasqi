import { useState, useEffect, useRef, useCallback } from 'react';
import { isIOSPWA } from '@/utils/platform-detection';

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
  const lastTouchYRef = useRef(0);
  const scrollTopAtStartRef = useRef(0);
  const pullContainerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const hasMovedRef = useRef(false);

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

  // Use the platform detection utility
  const iosPwaDetected = isIOSPWA();
  const shouldEnablePullToRefresh = isPWA ? true : true; // Always enable for now

  // Reset pull state when refresh completes
  const resetPullState = useCallback(() => {
    setPullDistance(0);
    setIsPulling(false);
    hasMovedRef.current = false;
    
    // Additional reset for iOS PWA - ensure content is properly positioned
    if (iosPwaDetected && contentRef.current) {
      setTimeout(() => {
        if (contentRef.current) {
          // Reset any added padding
          contentRef.current.style.paddingTop = '0px';
          
          // Ensure scroll position is at top
          contentRef.current.scrollTop = 0;
        }
      }, 300);
    }
  }, [iosPwaDetected]);

  // Handle pull start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!contentRef.current) return;
    
    // Save the scroll position at the start of touch
    scrollTopAtStartRef.current = contentRef.current.scrollTop;
    
    // Only enable pull-to-refresh when at the top of the content
    if (scrollTopAtStartRef.current > 5) {
      return;
    }
    
    startYRef.current = e.touches[0].clientY;
    lastTouchYRef.current = e.touches[0].clientY;
    setIsPulling(true);
    hasMovedRef.current = false;
    
    console.log('Touch start at Y:', startYRef.current, 'ScrollTop:', scrollTopAtStartRef.current);
  }, []);

  // Handle touch move for pull effect
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    if (!contentRef.current) return;
    
    const currentY = e.touches[0].clientY;
    lastTouchYRef.current = currentY;
    
    // Critical: iOS PWA needs to check scroll position DURING the move
    // since bounce effects can change scrollTop dynamically
    const currentScrollTop = contentRef.current.scrollTop;
    
    // If we've scrolled down, don't do pull-to-refresh
    if (currentScrollTop > 5) {
      setPullDistance(0);
      return;
    }
    
    const diff = currentY - startYRef.current;
    
    // Only consider downward movement
    if (diff <= 0) {
      setPullDistance(0);
      return;
    }
    
    // Mark that we've actually moved
    hasMovedRef.current = true;

    // Apply resistance to the pull
    const newDistance = Math.min(diff * 0.5, maxPullDownDistance);
    setPullDistance(newDistance);

    // For iOS in PWA mode, we need to apply special handling
    if (iosPwaDetected && currentScrollTop <= 0 && diff > 10) {
      e.preventDefault();
      
      // Use padding-top for iOS PWA instead of transform for better behavior
      if (contentRef.current) {
        contentRef.current.style.paddingTop = `${newDistance}px`;
      }
      
      console.log('iOS PWA pull handling', { diff, newDistance });
    }
  }, [isPulling, isRefreshing, maxPullDownDistance, iosPwaDetected]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isPulling || isRefreshing) return;
    
    // Only trigger refresh if we actually moved
    if (!hasMovedRef.current) {
      resetPullState();
      return;
    }
    
    console.log('Touch end, pull distance:', pullDistance, 'threshold:', pullDownThreshold);
    
    if (pullDistance >= pullDownThreshold) {
      // Trigger refresh
      setIsRefreshing(true);
      
      // For iOS PWA, keep padding at refresh indicator height
      if (iosPwaDetected && contentRef.current) {
        contentRef.current.style.paddingTop = `${refreshIndicatorHeight}px`;
      } else {
        setPullDistance(refreshIndicatorHeight);
      }
      
      // Execute refresh callback
      onRefresh()
        .finally(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            resetPullState();
          }, 300); // Slight delay for better UX
        });
    } else {
      // Reset without refreshing
      resetPullState();
    }
  }, [
    isPulling, 
    isRefreshing, 
    pullDistance, 
    pullDownThreshold, 
    refreshIndicatorHeight, 
    onRefresh,
    resetPullState,
    iosPwaDetected
  ]);

  // Set up event listeners
  useEffect(() => {
    if (!shouldEnablePullToRefresh) return;
    
    const contentElement = contentRef.current;
    if (!contentElement) return;
    
    // For iOS PWA, we need to use { passive: false } to make preventDefault work
    const passiveOption = iosPwaDetected ? { passive: false } : { passive: !isIOS };
    
    console.log('Setting up pull-to-refresh listeners', { 
      isIOS, 
      isStandalone, 
      iosPwaDetected, 
      passiveOption 
    });
    
    contentElement.addEventListener('touchstart', handleTouchStart, passiveOption);
    contentElement.addEventListener('touchmove', handleTouchMove, passiveOption);
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
    isIOS,
    iosPwaDetected
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
    visibility: pullDistance > 0 || isRefreshing ? 'visible' as const : 'hidden' as const,
    opacity: Math.min(pullDistance / pullDownThreshold, 1),
    transform: iosPwaDetected ? 'none' : `translateY(${pullDistance > 0 ? pullDistance : 0}px)`
  };

  // Prepare style for the content - different for iOS PWA vs standard
  const contentStyle = iosPwaDetected ? {
    height: '100%',
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  } : {
    transform: `translateY(${pullDistance}px)`,
    transition: isRefreshing || (!isPulling && pullDistance > 0)
      ? 'transform 0.2s ease-out'
      : 'none',
    height: '100%',
    overflowY: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
  };

  return {
    containerRef: pullContainerRef,
    contentRef,
    isRefreshing,
    containerStyle,
    contentStyle,
    refreshIndicatorStyle,
    pullDistance,
    isIOSPWA: iosPwaDetected,
    resetPullState
  };
}
