
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useNetworkDetection } from '../use-network-detection';

describe('useNetworkDetection', () => {
  const originalNavigatorOnLine = window.navigator.onLine;
  
  beforeEach(() => {
    // Reset navigator.onLine before each test
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });
  
  afterEach(() => {
    // Restore original navigator.onLine after each test
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: originalNavigatorOnLine,
    });
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
});
