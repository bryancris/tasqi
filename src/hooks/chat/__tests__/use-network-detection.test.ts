
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useNetworkDetection } from '../use-network-detection';

describe('useNetworkDetection', () => {
  const originalNavigatorOnLine = window.navigator.onLine;
  
  beforeEach(() => {
    // Reset navigator.onLine before each test
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    // Mock Date.now to control timing
    vi.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    // Restore original navigator.onLine after each test
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: originalNavigatorOnLine,
    });
    
    vi.restoreAllMocks();
  });

  it('should return true when network is available', () => {
    const { result } = renderHook(() => useNetworkDetection());
    
    expect(result.current.isNetworkAvailable()).toBe(true);
  });

  it('should return false when network is not available', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    const { result } = renderHook(() => useNetworkDetection());
    
    expect(result.current.isNetworkAvailable()).toBe(false);
  });
  
  it('should debounce rapid online/offline changes', () => {
    const { result } = renderHook(() => useNetworkDetection());
    
    // Initially online
    expect(result.current.isOnline).toBe(true);
    
    // Trigger offline event
    act(() => {
      // Simulate 1 second later
      vi.mocked(Date.now).mockReturnValue(2000);
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOnline).toBe(false);
    
    // Trigger online event immediately - should be ignored due to debounce
    act(() => {
      // Only 1 second later - below threshold
      vi.mocked(Date.now).mockReturnValue(3000); 
      window.dispatchEvent(new Event('online'));
    });
    
    // Should still be offline due to debounce
    expect(result.current.isOnline).toBe(false);
    
    // Trigger online event after sufficient time
    act(() => {
      // 6 seconds later - above threshold
      vi.mocked(Date.now).mockReturnValue(8000); 
      window.dispatchEvent(new Event('online'));
    });
    
    // Should be online now
    expect(result.current.isOnline).toBe(true);
  });
});
