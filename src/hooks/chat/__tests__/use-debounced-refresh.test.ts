
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '../../../test/test-utils';
import { act } from '../../../test/test-utils';
import { useDebouncedRefresh } from '../use-debounced-refresh';

describe('useDebouncedRefresh', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize properly', () => {
    const { result } = renderHook(() => useDebouncedRefresh());
    
    expect(result.current).toHaveProperty('debouncedRefresh');
    expect(result.current).toHaveProperty('isMountedRef');
    expect(result.current.isMountedRef.current).toBe(true);
  });

  it('should debounce refresh calls', () => {
    const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
    vi.mocked(require('@tanstack/react-query').useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries
    });
    
    const { result } = renderHook(() => useDebouncedRefresh());
    
    // Call debouncedRefresh multiple times with the same key
    act(() => {
      result.current.debouncedRefresh(['tasks'], 500);
      result.current.debouncedRefresh(['tasks'], 500);
      result.current.debouncedRefresh(['tasks'], 500);
    });
    
    // With our mocked setTimeout that executes callbacks immediately,
    // this should only be called once due to the tracking of pending refreshes
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['tasks'] });
  });

  it('should allow refreshing different query keys', () => {
    const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);
    vi.mocked(require('@tanstack/react-query').useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries
    });
    
    const { result } = renderHook(() => useDebouncedRefresh());
    
    act(() => {
      result.current.debouncedRefresh(['tasks'], 500);
      result.current.debouncedRefresh(['notifications'], 500);
    });
    
    // With our mocked setTimeout, both should be called
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['tasks'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });
  });

  it('should update the isMountedRef on unmount', () => {
    const { result, unmount } = renderHook(() => useDebouncedRefresh());
    
    // Initially mounted
    expect(result.current.isMountedRef.current).toBe(true);
    
    // Unmount the component
    unmount();
    
    // Should set isMountedRef to false
    expect(result.current.isMountedRef.current).toBe(false);
  });
});
